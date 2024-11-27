import { useState } from 'react';
import React, { useRef } from 'react';
import { postMessage, readFromLocalStorage, saveToLocalStorage } from './common/utilities.js';
import ReactCommonmark from 'react-commonmark';
import Modal from './components/Modal';
import menu from './data/menuItems.json';
import logo from './assets/joyouslogo.png';
import './App.css';

// Define the Message interface
interface Message {
  role: 'user' | 'system'; // Specify the roles
  content: string; // Content should be a string
}

interface SelectionInterface {
  type: 'traditional' | 'llm' | 'home';
}

function App() {
  const [currentQuery, setCurrentQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isResponseLoading, setIsResponseLoading] = useState(false);

  const [interfaceMode, setInterfaceMode] = useState<SelectionInterface>({ type: 'home' });
  const [isModalOpen, setIsModalOpen] = useState(false); // State to manage modal visibility

  const openModal = () => setIsModalOpen(true); // Function to open the modal
  const closeModal = () => setIsModalOpen(false); // Function to close the modal

  const messagesEndRef = useRef<HTMLDivElement>(null);
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const dietaryRestrictions = readFromLocalStorage('dietaryRestrictions');
  const foodsIDontLike = readFromLocalStorage('foodsIDontLike');
  const foodsILike = readFromLocalStorage('foodsILike');

  const systemPrompt = 'Act as a knowledgeable waiter and only suggest items priced under $22 and suggest a max of 3items based on the user\'s query on this menu in the JSON format: ' + JSON.stringify(menu);
    
  let fullMessage = systemPrompt + ' ' + currentQuery;
  fullMessage += ' Do not suggest items with the following dietary restrictions: ' + readFromLocalStorage('dietaryRestrictions');
  fullMessage += ' You can suggest items in the following list only if the user asks for them, but make sure to mention you recognize they do not usually like the following ingredients: ' + readFromLocalStorage('foodsIDontLike');
  fullMessage += ' Favor items with the following ingredients: ' + readFromLocalStorage('foodsIDontLike');

  const submitHandler = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    setLoadingMessage('Processing...');
    setIsResponseLoading(true);

    const prevMessages = messages;
    prevMessages.push({
      role: "user",
      content: currentQuery
    });
    setMessages(prevMessages);

    const stream = await postMessage(fullMessage);
    
    if (stream.length > 0) {
      const newSystemMessage: Message = {
        role: "system",
        content: stream[0].output
      }

      const prevMessages = messages;
      prevMessages.push(newSystemMessage);
      setMessages(prevMessages);
    } else {

      const newSystemMessage: Message = {
        role: "system",
        content: 'Something went wrong.  Please try again.'
      }
      const prevMessages = messages;
      prevMessages.push(newSystemMessage);
      setMessages(prevMessages);
    }
    setInterfaceMode({type: 'llm'});
    scrollToBottom();

    setCurrentQuery('');
    setIsResponseLoading(false);
    return
  };

  return (
    <>
    <button onClick={openModal} style={{ margin: '16px 8px' }}>My Food Preferences</button> {/* Button to open modal */}
      {isModalOpen && (
        <Modal onClose={closeModal}>
          <h2 style={{ textAlign: 'center', marginBottom: '32px', fontWeight: '100' }}>My Food Preferences</h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '32px', width: '80%' }}>
              <label style={{ marginBottom: '8px' }}><strong>Dietary Restrictions</strong></label>
              <textarea defaultValue={dietaryRestrictions} onChange={(e) => saveToLocalStorage('dietaryRestrictions', e.target.value)} style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '32px', width: '80%' }}>
              <label style={{ marginBottom: '8px' }}><strong>Food I Don't Like</strong></label>
              <textarea defaultValue={foodsIDontLike} onChange={(e) => saveToLocalStorage('foodsIDontLike', e.target.value)} style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', width: '80%' }}>
              <label style={{ marginBottom: '8px' }}><strong>Foods I Like</strong></label>
              <textarea defaultValue={foodsILike} onChange={(e) => saveToLocalStorage('foodsILike', e.target.value)} style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
          </div>
        </Modal>
        )} {/* Render the existing user preference modal, if open */}
      <div className='main-container'>
        <img src={logo} className="logo" alt="logo" />
        <h1 className='neon-text'>{import.meta.env.VITE_AUTHOR||"Mike Otte"} Plans Food</h1>
      </div>

      {interfaceMode?.type !== 'home' && (
        <div style={{textAlign: 'left'}}>
        <div onClick={() => setInterfaceMode({type: 'home'})} style={{textAlign: 'left', color: 'white', cursor: 'pointer'}}>&larr; Go Back</div>
        </div>
      )}

      <form className='form-container' onSubmit={submitHandler} style={{marginTop: '16px'}}>
        {isResponseLoading && <div className='query-loader'></div> }
        <input
        type='text'
        placeholder='What do you feel like eating today?'
        spellCheck='false'
        value={isResponseLoading ? loadingMessage : currentQuery}
        onChange={(e) => setCurrentQuery(e.target.value)}
        readOnly={isResponseLoading}
      />
      {!isResponseLoading && (
        <button type='submit' style={{borderRadius: '1.5rem'}}>
          Send
        </button>
      )}
      </form>

      {interfaceMode?.type === 'llm' && (
      <>
      <ul className='message-list'>
      <li key={-1} className='agent'><ReactCommonmark source='What do you feel like eating today?' /></li>
        {messages.map((message, index) => (
          <li key={index} className={message.role}><ReactCommonmark source={message.content || ''} /></li>
        ))}
        <div ref={messagesEndRef} />
      </ul>
      </>
      )}
      
      {interfaceMode?.type !== 'traditional' && (
        <div onClick={() => setInterfaceMode({type: 'traditional'})} style={{margin: '16px 8px 16px 8px', cursor: 'pointer', marginTop: '16px'}}>See Full Menu</div>
      )}

      {interfaceMode?.type === 'traditional' && (
        <>
        <h3>Community Populars</h3>
        <ul style={{ listStyleType: 'none', color: 'white', textAlign: 'left', display: 'flex', overflowX: 'auto', padding: '0 0 16px 0' }}>
          {menu.allItems.popularItems.items
            .filter(item => parseFloat(item.displayPrice.replace('$', '')) < 22)
            .map((item, index) => (
              <li key={index} className={item.name} style={{ marginRight: '10px', minWidth: '240px' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <img src={item.imageUrl} alt={item.name} style={{ width: '100px', height: 'auto' }} />
                  <div>
                  <div>
                    <strong>{item.name}</strong>
                  </div>
                  <div>{item.displayPrice}</div>
                  </div>
                </span>
              </li>
            ))}
        </ul>
        <h3>Mike's Recommendations</h3>
        <ul style={{ listStyleType: 'none', color: 'white', textAlign: 'left', display: 'flex', overflowX: 'auto', padding: '0 0 16px 0' }}>
          {menu.allItems.featuredItems.items
            .filter(item => parseFloat(item.displayPrice.replace('$', '')) < 22)
            .map((item, index) => (
              <li key={index} className={item.name} style={{ marginRight: '10px', minWidth: '240px' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <img src={item.imageUrl} alt={item.name} style={{ width: '100px', height: 'auto' }} />
                  <div>
                  <div>
                    <strong>{item.name}</strong>
                  </div>
                  <div>{item.displayPrice}</div>
                  </div>
                </span>
              </li>
            ))}
        </ul>
        <h3>Protein Plates</h3>
        <ul style={{ listStyleType: 'none', color: 'white', textAlign: 'left', display: 'flex', overflowX: 'auto', padding: '0 0 16px 0' }}>
          {menu.allItems.proteinPlates.items
            .filter(item => parseFloat(item.displayPrice.replace('$', '')) < 22)
            .map((item, index) => (
              <li key={index} className={item.name} style={{ marginRight: '10px', minWidth: '240px' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <img src={item.imageUrl} alt={item.name} style={{ width: '100px', height: 'auto' }} />
                  <div>
                  <div>
                    <strong>{item.name}</strong>
                  </div>
                  <div>{item.displayPrice}</div>
                  </div>
                </span>
              </li>
            ))}
        </ul>
        <h3>Bowls</h3>
        <ul style={{ listStyleType: 'none', color: 'white', textAlign: 'left', display: 'flex', overflowX: 'auto', padding: '0 0 16px 0' }}>
          {menu.allItems.bowls.items
            .filter(item => parseFloat(item.displayPrice.replace('$', '')) < 22)
            .map((item, index) => (
              <li key={index} className={item.name} style={{ marginRight: '10px', minWidth: '240px' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <img src={item.imageUrl} alt={item.name} style={{ width: '100px', height: 'auto' }} />
                  <div>
                  <div>
                    <strong>{item.name}</strong>
                  </div>
                  <div>{item.displayPrice}</div>
                  </div>
                </span>
              </li>
            ))}
        </ul>
        <h3>Salads</h3>
        <ul style={{ listStyleType: 'none', color: 'white', textAlign: 'left', display: 'flex', overflowX: 'auto', padding: '0 0 16px 0' }}>
          {menu.allItems.salads.items
            .filter(item => parseFloat(item.displayPrice.replace('$', '')) < 22)
            .map((item, index) => (
              <li key={index} className={item.name} style={{ marginRight: '10px', minWidth: '240px' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <img src={item.imageUrl} alt={item.name} style={{ width: '100px', height: 'auto' }} />
                  <div>
                  <div>
                    <strong>{item.name}</strong>
                  </div>
                  <div>{item.displayPrice}</div>
                  </div>
                </span>
              </li>
            ))}
        </ul>
        </>
      )}
    </>
  )
}

export default App
