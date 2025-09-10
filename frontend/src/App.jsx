import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useWebSocket from 'react-use-websocket';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Card } from './Card';
import './App.css';

// Mantine Imports
import { Title, Modal, Text, TextInput, Textarea, Button, Group, Avatar } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';

// --- DYNAMIC URLS ---
// This prompt will ask for a name to simulate different users.
const username = prompt("Please enter your name for this session:", "user" + Math.floor(Math.random() * 100));

const isProduction = import.meta.env.PROD;
const API_BASE_URL = isProduction ? '' : 'http://localhost:8000';
const WS_BASE_URL = isProduction ? `wss://${window.location.host}` : 'ws://localhost:8000';

const API_URL = `${API_BASE_URL}/api`;
const WS_URL = `${WS_BASE_URL}/ws/board/1/?username=${username}`;
// --- END DYNAMIC URLS ---

function App() {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  const { lastJsonMessage, readyState } = useWebSocket(WS_URL);

  const form = useForm({
    initialValues: { title: '', description: '' },
    validate: { title: (value) => (value.trim().length > 0 ? null : 'Title is required') },
  });

  useEffect(() => {
    if (selectedCard) {
      form.setValues({
        title: selectedCard.title,
        description: selectedCard.description || '',
      });
    }
  }, [selectedCard]);

  const fetchBoard = () => {
    axios.get(`${API_URL}/boards/1/`)
      .then(response => setBoard(response.data))
      .catch(err => setError("Failed to load board. Is the server running?"));
  };

  useEffect(() => { fetchBoard(); }, []);

  useEffect(() => {
    if (lastJsonMessage) {
      if (lastJsonMessage.type === 'board_update') {
        fetchBoard();
      } else if (lastJsonMessage.type === 'presence_update') {
        setOnlineUsers(lastJsonMessage.users);
      }
    }
  }, [lastJsonMessage]);
  
  const handleCardClick = (card) => {
    setSelectedCard(card);
    open();
  };
  
  const handleSaveCard = (values) => {
    if (!selectedCard) return;
    axios.patch(`${API_URL}/cards/${selectedCard.id}/`, values)
      .then(() => close())
      .catch(err => console.error("Error updating card", err));
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceColumn = board.columns.find(col => String(col.id) === source.droppableId);
    const destColumn = board.columns.find(col => String(col.id) === destination.droppableId);
    if (!sourceColumn || !destColumn) return;

    const sourceCards = Array.from(sourceColumn.cards);
    const [movedCard] = sourceCards.splice(source.index, 1);
    const newBoardState = { ...board };
    
    if (source.droppableId === destination.droppableId) {
      sourceCards.splice(destination.index, 0, movedCard);
      const newColumns = newBoardState.columns.map(col => String(col.id) === source.droppableId ? { ...col, cards: sourceCards } : col);
      setBoard({ ...newBoardState, columns: newColumns });
    } else {
      const destCards = Array.from(destColumn.cards);
      destCards.splice(destination.index, 0, movedCard);
      const newColumns = newBoardState.columns.map(col => {
        if (String(col.id) === source.droppableId) return { ...col, cards: sourceCards };
        if (String(col.id) === destination.droppableId) return { ...col, cards: destCards };
        return col;
      });
      setBoard({ ...newBoardState, columns: newColumns });
      
      axios.patch(`${API_URL}/cards/${draggableId}/`, { column: destColumn.id })
        .catch(err => {
          console.error("Error moving card! Reverting.", err);
          fetchBoard();
        });
    }
  };
  
  const connectionStatus = { 0: 'Connecting', 1: 'Open', 2: 'Closing', 3: 'Closed' }[readyState];
  if (error) return <div className="error">{error}</div>;
  if (!board) return <div>Loading board...</div>;

  return (
    <>
      <Modal opened={opened} onClose={close} title="Edit Card" centered>
        <form onSubmit={form.onSubmit(handleSaveCard)}>
          <TextInput required label="Title" {...form.getInputProps('title')} />
          <Textarea label="Description" placeholder="Add a more detailed description..." mt="md" {...form.getInputProps('description')} />
          <Group position="right" mt="md">
            <Button type="submit">Save</Button>
          </Group>
        </form>
      </Modal>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="app">
          <div className="connection-status">WebSocket: {connectionStatus}</div>
          <Group position="apart">
            <Title order={1}>{board.name}</Title>
            <Avatar.Group>
              {onlineUsers.map(user => (
                <Avatar key={user} color="blue" radius="xl" title={user}>
                  {user.substring(0, 2).toUpperCase()}
                </Avatar>
              ))}
            </Avatar.Group>
          </Group>
          <div className="board">
            {board.columns?.map(column => (
              <div key={column.id} className="column">
                <h2>{column.title}</h2>
                <Droppable droppableId={String(column.id)}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="card-container">
                      {column.cards?.map((card, index) => (
                        <Card key={card.id} card={card} index={index} onClick={() => handleCardClick(card)} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    </>
  );
}

export default App;