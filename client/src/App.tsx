
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import ProjectPage from './pages/Project'
import MyProject from './pages/MyProject'
import Preview from './pages/Preview'
import Community from './pages/Community'
import View from './pages/View'
import NavBar from './components/Navbar'
import { Toaster } from 'sonner'
import AuthPage from './pages/auth/AuthPage'
import Settings from './pages/Settings'


const App = () => {

  const {pathname}= useLocation()

  const hideNavbar = pathname.startsWith('/projects/')&& pathname !== '/projects' 
  || pathname.startsWith('/view/')
   || pathname.startsWith('/preview/')

   
  return (<>

 
    
    <div>
      <Toaster />
        {!hideNavbar && <NavBar /> }
      <Routes>
        <Route path='/' element={<Home />}/>
          <Route path='/projects/:projectId' element={<ProjectPage />}/>
           <Route path='/projects' element={<MyProject />}/>
            <Route path='/preview/:projectId/:versionId?' element={<Preview />}/>
              <Route path='/community' element={<Community />}/>
              <Route path='/view/:projectId' element={<View />}/>
               <Route path="/auth/:pathname" element={<AuthPage/>} />
               <Route  path='/account/settings' element={<Settings />}/>
      </Routes>
    </div>
    
    </>
  )
}

export default App
