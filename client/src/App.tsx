import { clear } from 'console';
import './App.css'
import { use, useState } from 'react'

function App() {
  const [isCollapsed, switchy] = useState(false);
  const toggleSidebar = () => {
    switchy(!isCollapsed);};
  const [hovered, setHovered] =useState(false);
  const [message, setMessage] = useState('');

  return (
    <div className='flex flex-row gap-0 w-full h-screen'>
      <div className={`max-md:hidden shrink-0 relative text-start shadow-sm box-border transition-[bg, width] duration-300 ease-in-out after:border-r-[1px] after:content-[''] after:z-10
        after:absolute after:pointer-events-none after:inset-0 after:border-sidebar-hover ${isCollapsed ? 'w-[52px] bg-main' : 'w-[260px] bg-sidebar-bg'} z-0`}>
        <div className='flex mt-1 ml-1 justify-center items-center w-11 h-11 rounded-lg hover:bg-sidebar-hover' 
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={isCollapsed ? toggleSidebar : undefined/* go to main menu*/}>
          <img src={isCollapsed && hovered ? 'maximizer.png' : 'logo.png'} className={`${isCollapsed && hovered ? 'h-6 w-6' : 'h-10 w-10'}`}></img>
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
        <div className='text-white text-xs w-[90%] relative p-2 m-0 select-text text-center'><h1>What do you want to work on today?</h1></div>

        <div className='flex items-center max-sm:justify-end w-[95%] relative h-14 bg-sidebar-hover rounded-3xl box-border shadow-md  p-4 max-w-2xl justify-center'>
          <div className='text-5xl absolute left-2 top-2 text-center h-10 w-10 justify-center rounded-full hover:bg-chatbar-bg cursor-pointer group flex-shrink-0'>
            <p className='absolute left-1.5 bottom-[-0.5px]'>+</p>
            <div className='tooltip'>
            Add files and more [ / ]</div></div>
          <textarea className=' w-[90%] bg-transparent text-white border-none resize-none outline-none text-lg overflow-hidden h-full' placeholder='Ask anything'></textarea>
        <div className='ml-4 text-4xl h-10 w-10 absolute group right-2 top-[6px] items-center justify-center rounded-full hover:bg-chatbar-bg cursor-pointer flex-shrink-0'>
          <span className='relative flex items-center justify-center'>🗣️</span>
        </div>
        </div>
      </div>
      </div>)

}

export default App
