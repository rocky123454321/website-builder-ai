import openai from '../configs/openai.js';
import { Request, Response } from 'express'
import prisma from '../lib/prisma.js';
//goods
export const makeRevision = async (req: Request, res: Response) => {
    const userId = req.userId;
    try {
        const { projectId } = req.params
        const { message } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })
      
        if (!userId || !user) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        if (user.credits < 5) {
            return res.status(403).json({ message: 'Add more credits to make changes' })
        }

        if (!message || message.trim() === '') {
            return res.status(400).json({ message: 'Please enter a valid prompt' })
        }

        const currentProject = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId },
            include: { versions: true }
        })

        if (!currentProject) {
            return res.status(404).json({ message: 'Project not found' })
        }

        // Log user message
        await prisma.conversation.create({
            data: {
                role: 'user',
                content: message,
                projectId
            }
        })

        // Decrement credits BEFORE async work starts
        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: 5 } }
        })

  const promptEnhanceResponce = await openai.chat.completions.create({
    model: 'kwaipilot/kat-coder-pro:free',
    messages:[
        {
            role: 'system',
            content: `
You are a prompt enhancement specialist. The user wants to make changes to their website. Enhance their request to be more specific and actionable for a web developer.

    Enhance this by:
    1. Being specific about what elements to change
    2. Mentioning design details (colors, spacing, sizes)
    3. Clarifying the desired outcome
    4. Using clear technical terms

Return ONLY the enhanced request, nothing else. Keep it concise (1-2 sentences).
`
        },
        {
            role:'user',
            content:`User request: "${message}"`
        }
    ]
  })
    const enhancedPrompt = promptEnhanceResponce.choices[0].message.content;

    await prisma.conversation.create({
        data:{
            role: 'assistant',
            content:`I've enhanced your prompt : "${enhancedPrompt}"`,
            projectId
        }
    })

    await prisma.conversation.create({
        data:{
            role: 'assistant',
            content:'I am currently building a website.',
            projectId
        }
    })

        const codeGenerationResponse = await openai.chat.completions.create({
        model: 'kwaipilot/kat-coder-pro:free',
        messages: [
            {
                role: 'system',
                content: `
You are an expert web developer.

    CRITICAL REQUIREMENTS:
    - Return ONLY the complete updated HTML code with the requested changes.
    - Use Tailwind CSS for ALL styling (NO custom CSS).
    - Use Tailwind utility classes for all styling changes.
    - Include all JavaScript in <script> tags before closing </body>
    - Make sure it's a complete, standalone HTML document with Tailwind CSS

    JAVASCRIPT REQUIREMENTS:
    - Use VALID CSS selectors (never use querySelector('#') or querySelector('.') alone)
    - Do NOT use postMessage() with DOM objects like SVGAnimatedString or elements
    - Use simple data types for any communication between frames/windows
    - Avoid complex object serialization that can fail
    - Use proper event listeners and DOM manipulation safely

    - Return the HTML Code Only, nothing else

    Apply the requested changes while maintaining the Tailwind CSS styling approach.`
            },
            {
                role: 'user',
                content: `Here is the current website code: "${currentProject.current_code}" 
            The user wants these changes: "${enhancedPrompt}"`
            }
        ]
    })
     const code = codeGenerationResponse.choices[0].message.content || '';

    // Clean up the generated code
    const cleanCode = (html: string): string => {
        if (!html) return '';

        // Remove markdown code fences
        let cleaned = html.replace(/```[a-z]*n?/gi,'')
            .replace(/```$/g,'')
            .trim();

        // Fix invalid CSS selectors (like querySelector('#') or querySelector('.'))
        cleaned = cleaned.replace(/querySelector\(['"`]#[^'"]*['"`]\)/g, 'querySelector(null)');
        cleaned = cleaned.replace(/querySelector\(['"`]\.[^'"]*['"`]\)/g, 'querySelector(null)');
        cleaned = cleaned.replace(/querySelector\(['"`]#[^'"]*#[^'"]*['"`]\)/g, 'querySelector(null)');
        // Fix empty or invalid selectors
        cleaned = cleaned.replace(/querySelector\(['"`]['"`]\)/g, 'querySelector(null)');
        cleaned = cleaned.replace(/querySelector\([^)]*\)/g, (match) => {
            const selector = match.match(/querySelector\(['"`]([^'"]*)['"`]\)/)?.[1];
            if (selector && (selector === '#' || selector === '.' || selector.startsWith('# ') || selector.startsWith('. '))) {
                return 'querySelector(null)';
            }
            return match;
        });

        // Remove or fix problematic postMessage calls with complex objects
        cleaned = cleaned.replace(/postMessage\([^)]*\bSVGAnimatedString\b[^)]*\)/g, '// Removed problematic postMessage with SVGAnimatedString');
        cleaned = cleaned.replace(/postMessage\([^)]*\bSVGElement\b[^)]*\)/g, '// Removed problematic postMessage with SVGElement');
        cleaned = cleaned.replace(/postMessage\([^)]*\belement\b[^)]*\)/g, '// Removed problematic postMessage with DOM element');

        // Remove empty script tags that might have been left after cleanup
        cleaned = cleaned.replace(/<script[^>]*>\s*<\/script>/gi, '');

        return cleaned;
    };

    const cleanedCode = cleanCode(code);

    const version = await prisma.version.create({
        data: {
            code: cleanedCode,
            description: 'chagest',
            projectId
        }
    })


    await prisma.conversation.create({
        data:{
            role:'assistant',
            content: "I've changes your website",
            projectId
        }
    })
  await prisma.websiteProject.update({
    where: {id: projectId},
    data: {
        current_code: cleanedCode,
        current_version_index: version.id
    }
  })
res.json({ message: 'changes successfully...' })


    } catch (error: any) {

         await prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: 5 } }
        })
        console.error('Error in makeRevision:', error.code || error.message)
        res.status(500).json({ message: error.message })
    }
}



export const rollBackToVersion = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const { projectId, versionId } = req.params

        const project = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId },
            include: { versions: true }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        const version = project.versions.find((version) => version.id === versionId)

        if (!version) {
            return res.status(404).json({ message: 'Version not found' })
        }

        await prisma.websiteProject.update({
            where: { id: projectId , userId},
            data: {
                current_code: version.code,
                current_version_index: version.id
            }
        })

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "I've rolled back your website to the selected version. You can now preview it",
                projectId
            }
        })

        res.json({ message: 'Version rolled back successfully' })
    } catch (error: any) {
        console.error(error.code || error.message)
        res.status(500).json({ message: error.message })
    }
}

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { projectId } = req.params
     

        await prisma.websiteProject.delete({
            where: { id: projectId },
        })

        res.json({ message: 'Project deleted successfully' })
    } catch (error: any) {
        console.error('Error in deleteProject:', error.message)
        res.status(500).json({ message: error.message })
    }
}

export const getProjectPreview = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { projectId } = req.params

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const project = await prisma.websiteProject.findFirst({
            where: { id: projectId, userId },
            include: { versions: true }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        res.json({ project })
    } catch (error: any) {
        console.error('Error in getProjectPreview:', error.message)
        res.status(500).json({ message: error.message })
    }
}

export const getPublishProject = async (req: Request, res: Response) => {
    try {
        const projects = await prisma.websiteProject.findMany({
            where: { isPublished: true },
            include: { user: true }
        })

        res.json({ projects })
    } catch (error: any) {
        console.error('Error in getPublishProject:', error.message)
        res.status(500).json({ message: error.message })
    }
}

export const getProjectById = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params
        const project = await prisma.websiteProject.findFirst({
            where: { id: projectId }
        })

        if (!project || project.isPublished === false || !project?.current_code) {
            return res.status(404).json({ message: 'Project not found' })
        }

        res.json({ code: project.current_code })
    } catch (error: any) {
        console.error('Error in getProjectById:', error.message)
        res.status(500).json({ message: error.message })
    }
}

export const saveProjectCode = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const { projectId } = req.params
        const { code } = req.body

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        if (!code) {
            return res.status(400).json({ message: 'Code is required' })
        }

        const project = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        await prisma.websiteProject.update({
            where: { id: projectId },
            data: { current_code: code, current_version_index: '' }
        })

        res.json({ message: 'Project saved successfully' })
    } catch (error: any) {
        console.error('Error in saveProjectCode:', error.message)
        res.status(500).json({ message: error.message })
    }
}