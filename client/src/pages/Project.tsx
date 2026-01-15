import {  useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { Project } from '../types';
import {  ArrowBigDownDashIcon, EyeIcon, EyeOffIcon, FullscreenIcon, LaptopIcon, Loader2Icon, MessageSquareIcon, SaveIcon, SmartphoneIcon, TabletIcon, XIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ProjectPreview, { type ProjectPreviewRef } from '../components/ProjectPreview';
import api from '@/configs/axios';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import logo from '../assets/favicon.svg'

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {data: session, isPending} = authClient.useSession()
 
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [device, setDevice] = useState<'phone' | 'tablet' | 'desktop'>('desktop');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const previewRef = useRef<ProjectPreviewRef>(null)

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/api/user/project/${projectId}`)
      setProject(data.project)
      setIsGenerating(data.project.current_code? false: true)
      setLoading(false)
    } catch (error: any) {
      console.log(error);
    }
  }

  const saveProject = async () => {
   if(!previewRef.current) return
   const code = previewRef.current.getCode()
   if(!code) return
   setIsSaving(true);
   try {
    const {data} = await api.put(`/api/project/save/${projectId}` , {code})
    toast.success(data.message)
   } catch (error: any) {
     toast.error(error?.response?.data?.message || error.message)
     console.log(error)
   }finally{
    setIsSaving(false);
   }
  };

  const downloadCode = () => {
    const code = previewRef.current?.getCode() || project?.current_code;
    if (!code) {
      if (isGenerating) {
        toast.error('Wait for generation to complete')
        return
      }
      toast.error('No code available')
      return
    }

    const element = document.createElement('a')
    const file = new Blob([code], { type: "text/html" })
    element.href = URL.createObjectURL(file)
    element.download = "index.html"
    document.body.appendChild(element)
    element.click();
    document.body.removeChild(element)
  }

  const togglePublish = async () => {
    try {
    const {data} = await api.get(`/api/user/publish-toggle/${projectId}`)
    toast.success(data.message)
    setProject((prev)=>prev ?({...prev, isPublished: !prev.isPublished}) : null)
   } catch (error: any) {
     toast.error(error?.response?.data?.message || error.message)
     console.log(error)
   }
  }

  useEffect(() => {
    if (session?.user) {
      fetchProject()
    } else if (!isPending && !session?.user) {
      navigate("/")
      toast.message("Please login to view your project")
    }
  }, [session?.user])

  useEffect(() => {
    if (project && !project?.current_code) {
      const intervalId = setInterval(fetchProject, 10000)
      return () => clearInterval(intervalId)
    }
    
  }, [project]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2Icon className='w-7 h-7 animate-spin text-violet-200' />
      </div>
    );
  }

  return project ? (
    <div className='flex flex-col h-screen w-full bg-gray-900 text-white'>
      {/* builder navbar */}
      <div className='flex items-center gap-4 px-4 py-2 no-scrollbar overflow-x-auto'>
        {/* leftside */}
        <div className='flex items-center gap-4 flex-1 min-w-0'>
         <img src={logo} alt="logo" className='h-6 cursor-pointer shrink-0' 
            onClick={() => navigate('/')} />
          <div className='max-w-64 sm:max-w-xs min-w-0'>
            <p className='text-sm font-medium capitalize truncate'>{project.name}</p>
            <p className='text-sm text-gray-400 -mt-0.5'>Previewing last saved version</p>
          </div>
          <div className='sm:hidden flex-1 flex justify-end ml-auto'>
            {isMenuOpen ? <XIcon onClick={() => setIsMenuOpen(false)} className='size-6 cursor-pointer shrink-0' /> :
              <MessageSquareIcon onClick={() => setIsMenuOpen(true)} className='size-6 cursor-pointer shrink-0' />
            }
          </div>
        </div>
        {/* middle */}
       <div className="hidden sm:flex gap-2 bg-gray-950 p-1.5 rounded-md shrink-0 lg:mr-23">
  <SmartphoneIcon
    onClick={() => setDevice('phone')}
    className={`size-6 p-1 rounded cursor-pointer ${device === 'phone' ? 'bg-gray-700' : ''}`}
  />
  <TabletIcon
    onClick={() => setDevice('tablet')}
    className={`size-6 p-1 rounded cursor-pointer ${device === 'tablet' ? 'bg-gray-700' : ''}`}
  />
  <LaptopIcon
    onClick={() => setDevice('desktop')}
    className={`size-6 p-1 rounded cursor-pointer ${device === 'desktop' ? 'bg-gray-700' : ''}`}
  />
</div>

        {/* right */}


        <div className='flex items-center justify-end gap-2 sm:gap-3 shrink-0'>
      
          <button onClick={saveProject} disabled={isSaving} className='max-sm:hidden bg-gray-800 hover:bg-gray-700 text-white px-3.5 py-1 flex items-center
gap-2 rounded sm:rounded-sm transition-colors border border-gray-700'>{isSaving ? <Loader2Icon
            className='animate-spin size-4' /> : <SaveIcon size={16} />}save</button>

          <Link target='_blank' to={`/preview/${projectId}`} className='max-sm:hidden flex items-center
gap-2 px-4 py-1 rounded sm:rounded-sm border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-colors text-sm'> <FullscreenIcon size={16} />Preview</Link>

          <button onClick={downloadCode} className='bg-linear-to-br from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white px-3.5 py-1 flex items-center
gap-2 rounded sm:rounded-sm transition-colors text-sm' > <ArrowBigDownDashIcon size={16} /> Download</button>

          <button onClick={togglePublish} className='bg-linear-to-br from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white px-3.5 py-1 flex items-center
gap-2 rounded sm:rounded-sm transition-colors border border-gray-700 text-sm'>{project.isPublished ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}{project.isPublished ? "Unpublish" : "Publish"}</button>
        </div>
      </div>
      <div className='flex-1 flex overflow-auto'>
        <Sidebar isMenuOpen={isMenuOpen} project={project} setProject={(p: Project) => setProject(p)} isGenerating={isGenerating} setIsGenerating={setIsGenerating} />
        <div className='flex-1 p-2 pl-0'><ProjectPreview ref={previewRef} project={project} isGenerating={isGenerating}
          device={device} /></div>
      </div>
    </div>

  ) : (
    <div className='flex items-center justify-center h-screen'>
      <p className='text-2xl font-medium text-gray-200'>Unable to load project </p>
    </div>
  )
}

export default ProjectPage