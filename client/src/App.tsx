import './App.css'
import { use, useState } from 'react'

function App() {
  const [isCollapsed, switchy] = useState(false);
  const toggleSidebar = () => {
    switchy(!isCollapsed);};
  const [hovered, setHovered] =useState(false);
  const sidebar_full = 260;
  const sidebar_min = 52;

  return (
    <div className='flex flex-row gap-0 w-full h-screen'>
      <div className={`relative text-start shadow-sm box-border transition-[bg, width] duration-300 ease-in-out after:border-r-[1px] after:content-[''] after:z-10
        after:absolute after:pointer-events-none after:inset-0 after:border-sidebar-hover ${isCollapsed ? 'w-[52px] bg-main' : 'w-[260px] bg-sidebar-bg'} z-0`}>
        <div className='flex mt-1 ml-1 justify-center items-center w-11 h-11 rounded-lg hover:bg-sidebar-hover' 
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={isCollapsed ? toggleSidebar : undefined/* go to main menu*/}>
          <img src={isCollapsed && hovered ? 'minimizer.png' : 'logo.png'} className={`${isCollapsed && hovered ? 'h-6 w-6' : 'h-10 w-10'}`}></img>
        </div>
        {isCollapsed ? null :
        <div className={`z-10 fixed top-1.5 left-52 h-10 w-10 rounded-lg hover:bg-sidebar-hover`} onClick={toggleSidebar}>
          {isCollapsed ? null :
        <img src='minimizer.png' className='block h-6 w-6 mx-auto my-2 object-contain'></img>}</div>}
        <div className={` place-items-center transition-colors 0.2s ease-in-out grid grid-cols-1 ${isCollapsed ? 'text-main-bg' : 'text-white'}`}>
          <div className={`rounded-lg shadow-md p-2 ${isCollapsed ? 'w-[80%]' : 'w-[95%]'} h-10 hover:bg-sidebar-hover`}>
            <span className={`left-4 text-xl before:mr-4 before:content-['🗒️'] fixed font-semibold text-[14px]`}>New chat</span>
          </div>
          <div className={`rounded-lg shadow-md p-2 ${isCollapsed ? 'w-[80%]' : 'w-[95%]'} h-10 hover:bg-sidebar-hover`}>
            <span className={`left-4 text-xl before:mr-4 before:content-['🔍'] fixed font-semibold text-[14px]`}>Search chats</span>
          </div>
          <div className={`rounded-lg shadow-md p-2 ${isCollapsed ? 'w-[80%]' : 'w-[95%]'} h-10 hover:bg-sidebar-hover`}>
            <span className={`left-4 text-xl before:mr-4 before:content-['📚'] fixed font-semibold text-[14px]`}>Library</span>
          </div>
        </div>
      </div>
      <div className='flex flex-col flex-grow min-h-full bg-main-bg z-20 justify-center items-center gap-10 box-border'>
        <div className='text-center w-[95%] relative h-12 bg-sidebar-hover rounded-3xl box-border shadow-md  p-4 max-w-3xl'></div>
      </div>
      </div>)

}

export default App
