import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Project } from '../types'
import { iframeScript } from '../assets/assets';
import EditorPanel from './EditorPanel';
import LoaderSteps from './LoaderSteps';

// Utility function to fix common issues in AI-generated HTML
export const fixGeneratedHtml = (html: string): string => {
    if (!html) return '';

    let processedHtml = html;

    // Fix common issues in AI-generated HTML
    // 1. Replace problematic Tailwind CDN with working one
    processedHtml = processedHtml.replace(
        /https:\/\/cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser@\d+\/?/g,
        'https://cdn.tailwindcss.com'
    );

    // 2. Fix link tags that should be script tags for Tailwind
    processedHtml = processedHtml.replace(
        /<link[^>]*href=["']https:\/\/cdn\.tailwindcss\.com["'][^>]*>/g,
        '<script src="https://cdn.tailwindcss.com"></script>'
    );

    // 3. Remove @tailwind directives that cause issues
    processedHtml = processedHtml.replace(/@tailwind\s+[^;]+;/g, '');

    // 4. Fix invalid CSS selectors
    processedHtml = processedHtml.replace(/:contains\([^)]+\)/g, '[data-text*="Empowering you"]');

    // 5. Ensure proper HTML structure
    if (!processedHtml.includes('<html>')) {
        processedHtml = '<html><head></head><body>' + processedHtml + '</body></html>';
    }
    if (!processedHtml.includes('<head>') && processedHtml.includes('<html>')) {
        processedHtml = processedHtml.replace('<html>', '<html><head></head>');
    }

    // Ensure Tailwind CSS is properly loaded
    if (!processedHtml.includes('cdn.tailwindcss.com') && !processedHtml.includes('@tailwindcss')) {
        const tailwindScript = '<script src="https://cdn.tailwindcss.com"></script>';
        if (processedHtml.includes('<head>')) {
            processedHtml = processedHtml.replace('<head>', '<head>' + tailwindScript);
        } else {
            processedHtml = processedHtml.replace('<html>', '<html><head>' + tailwindScript + '</head>');
        }
    }

    // Fix script tags that might have ES module issues
    processedHtml = processedHtml.replace(
        /<script[^>]*type=["']module["'][^>]*>[\s\S]*?<\/script>/g,
        (match) => match.replace('type="module"', '').replace(/import\s+.*?\s+from\s+['"][^'"]+['"];?\s*/g, '')
    );

    return processedHtml;
};


interface ProjectPreviewProps{
    project: Project;
    isGenerating :boolean;
    device?:'phone' |'tablet' |'desktop';
    showEditorPanel?:boolean;

}

export interface ProjectPreviewRef{
    getCode:()=> string| undefined;

}

type SelectedElement = {
    tagName: string;
    className: string;
    text: string;
    styles: {
        padding: string;
        margin: string;
        backgroundColor: string;
        color: string;
        fontSize: string;
    };
} | null;

const ProjectPreview = forwardRef<ProjectPreviewRef, ProjectPreviewProps>(({project , isGenerating, device= 'desktop', showEditorPanel = true}, ref)=>{

    const iframeRef = useRef<HTMLIFrameElement>(null);

    const [selectedElement,setSelectedElement]= useState<SelectedElement>(null)

    const resolutions ={
        phone: 'w-[412px]',
        tablet: 'w-[768px]',
        desktop:'w-full'
    }

    useImperativeHandle(ref, () => ({
        getCode: () => {
            const doc = iframeRef.current?.contentDocument;
            if(!doc) return undefined
         
            doc.querySelectorAll('.ai-selected-element, [data-ai-selected]').forEach((el)=>{
                el.classList.remove('ai-selected-element')
                el.removeAttribute('data-ai-selected');
                (el as HTMLElement).style.outline =''
            })
          
           const previewStyle = doc.getElementById('ai-preview-style');
           if(previewStyle) previewStyle.remove()

            const previewScript =doc.getElementById('ai-preview-script')
            if(previewScript) previewScript.remove()

                const html = doc.documentElement.outerHTML
                return html;
        }
    }))

    useEffect(()=>{
const handleMessage =(event: MessageEvent)=>{
   if(event.data.type ==='ELEMENT_SELECTED'){
    setSelectedElement(event.data.payload)
   }else if(event.data.type === 'CLEAR_SELECTION'){
    setSelectedElement(null)
   }
}
window.addEventListener('message', handleMessage)
return()=> window.removeEventListener('message', handleMessage)
    },[])

    const handleUpdate = (updates: unknown)=>{
      if(iframeRef.current?.contentWindow){
        iframeRef.current.contentWindow.postMessage({
            type:'UPDATE_ELEMENT',
            payload: updates
        }, '*')
      }
    }

    const injectPreview =(html: string)=>{
        if(!html) return '';

        let processedHtml = fixGeneratedHtml(html);

        if(!showEditorPanel) return processedHtml;

        if(processedHtml.includes('</body>'))
            return processedHtml.replace('</body>', iframeScript + '</body>')
        else{
            return processedHtml + iframeScript
        }
    }


    return(
      
        <div className='relative h-full bg-gray-900 flex-1 rounded-xl overflow-hidden max-sm:ml-2'>
         {project.current_code? (
            <>
          
            <iframe
            ref={iframeRef}  
            srcDoc={injectPreview(project.current_code)}
            className={`h-full max-sm:w-full ${resolutions[device]} mx-auto transition-all`}
             />
             {showEditorPanel && selectedElement && (
                <EditorPanel selectedElement={selectedElement} onUpdate={handleUpdate} onClose={()=>{
                    setSelectedElement(null)
                    if(iframeRef.current?.contentWindow){
                        iframeRef.current.contentWindow.postMessage({type:'CLEAR_SELECTION_REQUEST'}, '*')
                    }
                }}/>
             )}
            </>
         ): isGenerating &&(
    <LoaderSteps />
         )}
        </div>
    )
})

export default ProjectPreview
