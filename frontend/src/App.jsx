import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useWebSocket from 'react-use-websocket';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Card } from './Card';
import './App.css';

// Mantine Imports
import { 
  Title, 
  Modal, 
  Text, 
  TextInput, 
  Textarea, 
  Button, 
  Group, 
  Avatar,
  ActionIcon,
  Menu,
  Flex,
  Paper,
  Select,
  Badge,
  Notification
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconDots,
  IconCheck,
  IconX 
} from '@tabler/icons-react';

// --- DYNAMIC URLS ---
const username = prompt("Please enter your name for this session:", "user" + Math.floor(Math.random() * 100));

const isProduction = import.meta.env.PROD;
const API_BASE_URL = isProduction ? '' : 'http://localhost:8000';
const WS_BASE_URL = isProduction ? `wss://${window.location.host}` : 'ws://localhost:8000';

const API_URL = `${API_BASE_URL}/api`;
const WS_URL = `${WS_BASE_URL}/ws/board/1/?username=${username}`;

function App() {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  
  // Modal states
  const [cardModalOpened, { open: openCardModal, close: closeCardModal }] = useDisclosure(false);
  const [addCardModalOpened, { open: openAddCardModal, close: closeAddCardModal }] = useDisclosure(false);
  const [addColumnModalOpened, { open: openAddColumnModal, close: closeAddColumnModal }] = useDisclosure(false);
  
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedColumnForNewCard, setSelectedColumnForNewCard] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  const { lastJsonMessage, readyState } = useWebSocket(WS_URL);

  // Forms
  const cardForm = useForm({
    initialValues: { title: '', description: '' },
    validate: { title: (value) => (value.trim().length > 0 ? null : 'Title is required') },
  });

  const newCardForm = useForm({
    initialValues: { title: '', description: '', column: '' },
    validate: { 
      title: (value) => (value.trim().length > 0 ? null : 'Title is required'),
      column: (value) => (value ? null : 'Please select a column')
    },
  });

  const columnForm = useForm({
    initialValues: { title: '' },
    validate: { title: (value) => (value.trim().length > 0 ? null : 'Column title is required') },
  });

  useEffect(() => {
    if (selectedCard) {
      cardForm.setValues({
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

  useEffect(() => { 
    fetchBoard(); 
  }, []);

  useEffect(() => {
    if (lastJsonMessage) {
      if (lastJsonMessage.type === 'board_update') {
        fetchBoard();
        showNotification(lastJsonMessage.message, 'success');
      } else if (lastJsonMessage.type === 'presence_update') {
        setOnlineUsers(lastJsonMessage.users);
      }
    }
  }, [lastJsonMessage]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  const handleCardClick = (card) => {
    setSelectedCard(card);
    openCardModal();
  };

  const handleAddCardClick = (columnId) => {
    setSelectedColumnForNewCard(columnId);
    newCardForm.setValues({ title: '', description: '', column: columnId });
    openAddCardModal();
  };
  
  const handleSaveCard = (values) => {
    if (!selectedCard) return;
    axios.patch(`${API_URL}/cards/${selectedCard.id}/`, values)
      .then(() => {
        closeCardModal();
        showNotification('Card updated successfully!');
      })
      .catch(err => {
        console.error("Error updating card", err);
        showNotification('Error updating card', 'error');
      });
  };

  const handleCreateCard = (values) => {
    const cardData = {
      title: values.title,
      description: values.description,
      column: values.column,
      order: 0 // You might want to calculate proper order
    };

    axios.post(`${API_URL}/cards/`, cardData)
      .then(() => {
        closeAddCardModal();
        newCardForm.reset();
        showNotification('Card created successfully!');
      })
      .catch(err => {
        console.error("Error creating card", err);
        showNotification('Error creating card', 'error');
      });
  };

  const handleCreateColumn = (values) => {
    const columnData = {
      title: values.title,
      board: board.id,
      order: board.columns.length // Add to end
    };

    axios.post(`${API_URL}/columns/`, columnData)
      .then(() => {
        closeAddColumnModal();
        columnForm.reset();
        showNotification('Column created successfully!');
      })
      .catch(err => {
        console.error("Error creating column", err);
        showNotification('Error creating column', 'error');
      });
  };

  const handleDeleteCard = (cardId) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    
    axios.delete(`${API_URL}/cards/${cardId}/`)
      .then(() => {
        closeCardModal();
        showNotification('Card deleted successfully!');
      })
      .catch(err => {
        console.error("Error deleting card", err);
        showNotification('Error deleting card', 'error');
      });
  };

  const handleDeleteColumn = (columnId) => {
    if (!confirm('Are you sure you want to delete this column? All cards in it will be deleted too.')) return;
    
    axios.delete(`${API_URL}/columns/${columnId}/`)
      .then(() => {
        showNotification('Column deleted successfully!');
      })
      .catch(err => {
        console.error("Error deleting column", err);
        showNotification('Error deleting column', 'error');
      });
  };

  const handleEditBoardTitle = () => {
    setTempTitle(board.name);
    setIsEditingTitle(true);
  };

  const handleSaveBoardTitle = () => {
    if (tempTitle.trim()) {
      axios.patch(`${API_URL}/boards/${board.id}/`, { name: tempTitle })
        .then(() => {
          setIsEditingTitle(false);
          showNotification('Board title updated!');
        })
        .catch(err => {
          console.error("Error updating board title", err);
          showNotification('Error updating board title', 'error');
        });
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setTempTitle('');
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
      const newColumns = newBoardState.columns.map(col => 
        String(col.id) === source.droppableId ? { ...col, cards: sourceCards } : col
      );
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
          showNotification('Error moving card', 'error');
        });
    }
  };

  const getStatusColor = () => {
    switch(readyState) {
      case 1: return 'connected';
      case 0: return 'connecting';
      default: return 'disconnected';
    }
  };

  const connectionStatus = { 0: 'Connecting', 1: 'Connected', 2: 'Closing', 3: 'Disconnected' }[readyState];
  
  if (error) return <div className="error">{error}</div>;
  if (!board) return <div>Loading board...</div>;

  const columnOptions = board.columns.map(col => ({
    value: col.id.toString(),
    label: col.title
  }));

  return (
    <>
      {/* Notification */}
      {notification && (
        <Notification
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}
          color={notification.type === 'error' ? 'red' : 'green'}
          onClose={() => setNotification(null)}
          icon={notification.type === 'error' ? <IconX /> : <IconCheck />}
        >
          {notification.message}
        </Notification>
      )}

      {/* Edit Card Modal */}
      <Modal opened={cardModalOpened} onClose={closeCardModal} title="Edit Card" centered size="md">
        <form onSubmit={cardForm.onSubmit(handleSaveCard)}>
          <TextInput required label="Title" {...cardForm.getInputProps('title')} />
          <Textarea 
            label="Description" 
            placeholder="Add a more detailed description..." 
            mt="md" 
            rows={4}
            {...cardForm.getInputProps('description')} 
          />
          <Group position="apart" mt="xl">
            <Button 
              variant="outline" 
              color="red" 
              onClick={() => selectedCard && handleDeleteCard(selectedCard.id)}
            >
              Delete Card
            </Button>
            <Group>
              <Button variant="subtle" onClick={closeCardModal}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </Group>
          </Group>
        </form>
      </Modal>

      {/* Add Card Modal */}
      <Modal opened={addCardModalOpened} onClose={closeAddCardModal} title="Add New Card" centered size="md">
        <form onSubmit={newCardForm.onSubmit(handleCreateCard)}>
          <Select
            required
            label="Column"
            placeholder="Select a column"
            data={columnOptions}
            {...newCardForm.getInputProps('column')}
          />
          <TextInput 
            required 
            label="Title" 
            mt="md"
            {...newCardForm.getInputProps('title')} 
          />
          <Textarea 
            label="Description" 
            placeholder="Add a description..." 
            mt="md" 
            rows={4}
            {...newCardForm.getInputProps('description')} 
          />
          <Group position="right" mt="xl">
            <Button variant="subtle" onClick={closeAddCardModal}>Cancel</Button>
            <Button type="submit">Create Card</Button>
          </Group>
        </form>
      </Modal>

      {/* Add Column Modal */}
      <Modal opened={addColumnModalOpened} onClose={closeAddColumnModal} title="Add New Column" centered>
        <form onSubmit={columnForm.onSubmit(handleCreateColumn)}>
          <TextInput 
            required 
            label="Column Title" 
            placeholder="e.g. In Progress, Done..."
            {...columnForm.getInputProps('title')} 
          />
          <Group position="right" mt="xl">
            <Button variant="subtle" onClick={closeAddColumnModal}>Cancel</Button>
            <Button type="submit">Create Column</Button>
          </Group>
        </form>
      </Modal>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="app">
          {/* Header */}
          <div className="app-header">
            <div className="header-left">
              <div>
                {isEditingTitle ? (
                  <Group spacing="xs">
                    <TextInput
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveBoardTitle();
                        if (e.key === 'Escape') handleCancelEditTitle();
                      }}
                      autoFocus
                    />
                    <ActionIcon color="green" onClick={handleSaveBoardTitle}>
                      <IconCheck size={16} />
                    </ActionIcon>
                    <ActionIcon color="red" onClick={handleCancelEditTitle}>
                      <IconX size={16} />
                    </ActionIcon>
                  </Group>
                ) : (
                  <Group spacing="xs">
                    <Title className="board-title" order={1}>{board.name}</Title>
                    <ActionIcon onClick={handleEditBoardTitle}>
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Group>
                )}
                <Text className="board-subtitle">
                  {board.columns.length} columns • {board.columns.reduce((acc, col) => acc + col.cards.length, 0)} cards
                </Text>
              </div>
            </div>
            
            <div className="header-right">
              <Group spacing="lg">
                <div className="presence-section">
                  <Text className="online-label">Online:</Text>
                  <Avatar.Group spacing="sm">
                    {onlineUsers.map(user => (
                      <Avatar key={user} color="blue" radius="xl" size="sm" title={user}>
                        {user.substring(0, 2).toUpperCase()}
                      </Avatar>
                    ))}
                  </Avatar.Group>
                </div>
                
                <Group spacing="xs">
                  <Button 
                    leftIcon={<IconPlus size={16} />}
                    onClick={openAddCardModal}
                    size="sm"
                  >
                    Add Card
                  </Button>
                  <Button 
                    leftIcon={<IconPlus size={16} />}
                    variant="outline"
                    onClick={openAddColumnModal}
                    size="sm"
                  >
                    Add Column
                  </Button>
                </Group>
              </Group>
            </div>
          </div>

          {/* Board */}
          <div className="board">
            {board.columns?.map(column => (
              <div key={column.id} className="column">
                <div className="column-header">
                  <div>
                    <Title className="column-title" order={3}>
                      {column.title}
                    </Title>
                    <Badge className="column-count" variant="filled">
                      {column.cards.length}
                    </Badge>
                  </div>
                  
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon>
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item 
                        icon={<IconPlus size={14} />}
                        onClick={() => handleAddCardClick(column.id)}
                      >
                        Add Card
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item 
                        color="red"
                        icon={<IconTrash size={14} />}
                        onClick={() => handleDeleteColumn(column.id)}
                      >
                        Delete Column
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </div>

                <Droppable droppableId={String(column.id)}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps} 
                      className={`card-container ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                    >
                      {column.cards?.map((card, index) => (
                        <Card 
                          key={card.id} 
                          card={card} 
                          index={index} 
                          onClick={() => handleCardClick(card)} 
                        />
                      ))}
                      {provided.placeholder}
                      
                      {/* Add Card Button in Column */}
                      <Button
                        variant="subtle"
                        fullWidth
                        leftIcon={<IconPlus size={16} />}
                        onClick={() => handleAddCardClick(column.id)}
                        className="add-card-btn"
                        size="sm"
                      >
                        Add a card
                      </Button>
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>

          {/* Connection Status */}
          <div className={`connection-status ${getStatusColor()}`}>
            <div className="status-dot"></div>
            <span>{connectionStatus}</span>
          </div>
        </div>
      </DragDropContext>
    </>
  );
}

export default App;