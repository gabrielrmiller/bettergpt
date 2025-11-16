import './App.css'
import { useRef, useState, useEffect } from 'react'

const MESSAGE_BANK = [
  "What do you want to work on today?",
  "How can I help you today?",
  "What would you like to explore?",
  "What's on your mind?",
  "What can we create together?",
  "What challenge are you facing?",
  "What would you like to learn about?",
  "What's your next project?",
];

function App() {
  const [isCollapsed, switchy] = useState(false);
  const toggleSidebar = () => {
    switchy(!isCollapsed);};
  const [hovered, setHovered] =useState(false);
  const [text, setText] =useState("");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ran =useRef(false);
  
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const KEY = 'messageIndex';
    const prev = Number(localStorage.getItem(KEY)) || 0;
    const next = (prev + 1) % MESSAGE_BANK.length;
    localStorage.setItem(KEY, next.toString());
    setCurrentMessageIndex(next);
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    const maxHeight = 300;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";}

  }, [text]);  
  const handleSubmit = () => {
    if (text.trim()) {
      console.log('Submitting:', text);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className='flex flex-row gap-0 w-full h-screen'>
      <div className={`max-md:hidden shrink-0 relative text-start shadow-sm box-border transition-[bg, width] duration-300 ease-in-out 
      after:border-r-[1px] after:content-[''] after:z-10 after:absolute after:pointer-events-none after:inset-0 after:border-sidebar-hover 
      ${isCollapsed ? 'w-[52px] bg-main' : 'w-[260px] bg-sidebar-bg'} z-0`}>
        <div className='flex mt-1 ml-1 justify-center items-center w-11 h-11 rounded-lg hover:bg-sidebar-hover' 
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={isCollapsed ? toggleSidebar : handleRefresh/* go to main menu*/}>
          <img src={isCollapsed && hovered ? `${import.meta.env.BASE_URL}maximizer.png` : `${import.meta.env.BASE_URL}logo.png`} className={`${isCollapsed && hovered ? 'h-6 w-6' : 'h-10 w-10'}`}></img>
        </div>
        {isCollapsed ? null :
        <div className={`z-10 fixed top-1.5 left-52 h-10 w-10 rounded-lg hover:bg-sidebar-hover`} onClick={toggleSidebar}>
          {isCollapsed ? null :
        <img src={`${import.meta.env.BASE_URL}minimizer.png`} className='block h-6 w-6 mx-auto my-2 object-contain'></img>}</div>}
        <div className={` place-items-center transition-colors 0.2s ease-in-out grid grid-cols-1 ${isCollapsed ? 'text-main-bg' : 'text-white'}`}>
          <div className={`rounded-lg p-2 ${isCollapsed ? 'w-[80%]' : 'w-[95%]'} h-10 hover:bg-sidebar-hover`}>
            <span className={`left-4 text-xl before:mr-4 before:content-['🗒️'] fixed font-semibold text-[14px]`}>New chat</span>
          </div>
          <div className={`rounded-lg p-2 ${isCollapsed ? 'w-[80%]' : 'w-[95%]'} h-10 hover:bg-sidebar-hover`}>
            <span className={`left-4 text-xl before:mr-4 before:content-['🔍'] fixed font-semibold text-[14px]`}>Search chats</span>
          </div>
          <div className={`rounded-lg p-2 ${isCollapsed ? 'w-[80%]' : 'w-[95%]'} h-10 hover:bg-sidebar-hover`}>
            <span className={`left-4 text-xl before:mr-4 before:content-['📚'] fixed font-semibold text-[14px]`}>Library</span>
          </div>
        </div>
      </div>
      <div className='flex flex-col flex-grow min-h-full bg-main-bg z-20 justify-center items-center gap-10 box-border'>
        <div className='text-white text-xs w-[90%] relative p-2 m-0 select-text text-center'><h1>{MESSAGE_BANK[currentMessageIndex]}</h1></div>

        <div className='items-start border-[#747474] border-[1px] flex flex-col w-[95%] relative h-auto bg-sidebar-hover rounded-3xl box-border shadow-xl max-w-2xl'>
          <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} className='outline-none overflow-y-auto w-full align-top 
          text-left flex pt-[14px] overflow-hidden pl-[18px] pr-[14px] h-[62px] max-h-[92] box-border bg-transparent resize-none text-white placeholder:tracking-wider' 
          placeholder='Ask anything'></textarea>
          <div className='border-t-[1px] border-[#747474] flex w-full relative min-h-[58px] box-border p-2 justify-between '>
          
          <div className="tooltip-wrapper" data-tooltip="Attach or add files"><button className='chatbar-item text-5xl bigplus'></button></div>
          <div className="tooltip-wrapper" data-tooltip="Submit"><button className='chatbar-item text-3xl' onClick={handleSubmit}>⬆️</button></div>

          </div>
          </div>
          
      </div>
      </div>)

}

export default App
