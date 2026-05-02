import { Request, Response } from 'express'
import prisma from '../lib/prisma.js';
import gemini from '../configs/gemini.js';

export const getUserCredits = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        res.json({ credits: user?.credits })
    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }
}

export const createUserProject = async (req: Request, res: Response) => {
    const userId = req.userId;
    try {
        const { initial_prompt } = req.body

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (user && user.credits < 5) {
            return res.status(403).json({ message: "Add credits to create more projects" })
        }

        const project = await prisma.websiteProject.create({
            data: {
                name: initial_prompt.length > 50 ? initial_prompt.substring(0, 47) + '...' : initial_prompt,
                initial_prompt,
                userId: userId as string
            }
        })

        await prisma.user.update({
            where: { id: userId as string },
            data: { totalCreation: { increment: 1 } }
        })

        await prisma.conversation.create({
            data: {
                role: 'user',
                content: initial_prompt,
                projectId: project.id,
            }
        })

        await prisma.user.update({
            where: { id: userId as string },
            data: { credits: { decrement: 5 } }
        })

        // Return projectId to client immediately
        res.json({ projectId: project.id })

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: 'Your web project is in progress…',
                projectId: project.id
            }
        })

        // Code Generation
       const codeGenerationResult = await gemini.generateContent(`
You are a world-class UI/UX designer (like top Dribbble designers) and senior frontend developer. Create a stunning, award-worthy single-page website based on this request: "${initial_prompt}"

DESIGN PHILOSOPHY:
- Think like a premium agency — every pixel matters
- Use bold, intentional design choices (not generic bootstrap-style layouts)
- Pick a strong, cohesive color story (e.g. deep navy + electric blue + white, or cream + forest green + gold)
- Use large, expressive typography with Google Fonts (mix a display font for headings + clean sans-serif for body)
- Generous whitespace — let the design breathe
- Asymmetric layouts, overlapping elements, diagonal sections — avoid boring box layouts

SECTIONS TO INCLUDE (make each section visually distinct):
1. Navigation — sticky, with blur backdrop (backdrop-blur-md bg-white/10)
2. Hero — full-screen, bold headline, subheadline, 2 CTA buttons, background gradient or mesh gradient
3. Features/Services — card grid with icons, hover effects, subtle shadows
4. Stats/Numbers — large animated counters with labels
5. Testimonials — clean quote cards with avatar initials and star ratings
6. CTA Banner — full-width colored section with strong call to action
7. Footer — multi-column with links, social icons, copyright

VISUAL DETAILS:
- Add CSS animations: fade-in on scroll (use IntersectionObserver), floating elements, gradient animations
- Cards must have: rounded-2xl, shadow-xl, hover:-translate-y-2, transition-all duration-300
- Buttons: gradient backgrounds, rounded-full, px-8 py-4, hover:shadow-lg hover:scale-105
- Use emoji icons or Unicode symbols if no icon library — make them large and colorful
- Section backgrounds must alternate: white → light gray → colored gradient → white
- Hero background: use CSS mesh gradient or animated gradient (not plain color)

TECHNICAL REQUIREMENTS:
- Tailwind CSS via: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
- Google Fonts: pick 2 fonts (display + body), load via CDN
- All images: use https://placehold.co with real dimensions like https://placehold.co/800x500?text=Hero, https://placehold.co/400x400?text=Team
- JavaScript: smooth scroll, mobile hamburger menu, scroll animations (IntersectionObserver), number counter animation
- Mobile responsive using Tailwind sm: md: lg: breakpoints

HARD RULES:
1. Return HTML ONLY — no markdown, no code fences, no explanations
2. Do NOT write \`\`\`html or \`\`\` anywhere
3. Start directly with <!DOCTYPE html>
4. NO inline style="" attributes — Tailwind classes ONLY
`)

        const code = codeGenerationResult.response.text() || '';
        const cleanedCode = code.replace(/```html/g, '').replace(/```/g, '').trim();

        const version = await prisma.version.create({
            data: {
                code: cleanedCode,
                description: 'Initial version',
                projectId: project.id
            }
        })

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "I've created the website",
                projectId: project.id
            }
        })

        await prisma.websiteProject.update({
            where: { id: project.id },
            data: {
                current_code: cleanedCode,
                current_version_index: version.id
            }
        })

    } catch (error: any) {
        await prisma.user.update({
            where: { id: userId as string },
            data: { credits: { increment: 5 } }
        })
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}

export const getUserProject = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const projectId = req.params.projectId as string

        const project = await prisma.websiteProject.findFirst({
            where: { id: projectId, userId },
            include: {
                conversation: {
                    orderBy: { timestamp: 'asc' }
                },
                versions: { orderBy: { timestamp: 'asc' } }
            }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        res.json({ project })
    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }
}

export const getUserProjects = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const projects = await prisma.websiteProject.findMany({
            where: { userId },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        res.json({ projects })
    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }
}

export const togglePublish = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const projectId = req.params.projectId as string

        const project = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        await prisma.websiteProject.update({
            where: { id: projectId },
            data: { isPublished: !project.isPublished }
        })

        res.json({ message: project.isPublished ? 'Project Unpublished' : 'Project Published Successfully' })
    } catch (error: any) {
        console.log(error.code || error.message)
        res.status(500).json({ message: error.message })
    }
}

export const purchaseCredits = async (req: Request, res: Response) => {
    //nomore 
}