import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useWebSocket from 'react-use-websocket';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Card } from './Card';
import './App.css';

// Mantine Imports
import {
    Title, Modal, TextInput, Textarea, Button, Group, Avatar, ActionIcon,
    Menu, Select, Badge, Notification, Text
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import {
    IconPlus, IconEdit, IconTrash, IconDots, IconCheck, IconX
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

    const [cardModalOpened, { open: openCardModal, close: closeCardModal }] = useDisclosure(false);
    const [addCardModalOpened, { open: openAddCardModal, close: closeAddCardModal }] = useDisclosure(false);
    const [addColumnModalOpened, { open: openAddColumnModal, close: closeAddColumnModal }] = useDisclosure(false);

    const [selectedCard, setSelectedCard] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const { lastJsonMessage, readyState } = useWebSocket(WS_URL, {
        shouldReconnect: (closeEvent) => true,
    });

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

    // Initial fetch for the board
    useEffect(() => {
        axios.get(`${API_URL}/boards/1/`)
            .then(response => setBoard(response.data))
            .catch(err => setError("Failed to load board. Is the server running?"));
    }, []);

    // --- Smart WebSocket State Reducer ---
    useEffect(() => {
        if (lastJsonMessage) {
            const { type, payload } = lastJsonMessage;
            
            setBoard(currentBoard => {
                if (!currentBoard) return null;
                switch (type) {
                    case 'PRESENCE_UPDATE':
                        setOnlineUsers(payload.users);
                        return currentBoard;
                    case 'BOARD_UPDATED':
                        showNotification(`Board title updated to "${payload.name}"`);
                        return { ...currentBoard, name: payload.name };
                    case 'COLUMN_CREATED':
                        showNotification(`Column "${payload.title}" was created`);
                        // Ensure cards property exists
                        const newColumn = { ...payload, cards: payload.cards || [] };
                        return { ...currentBoard, columns: [...currentBoard.columns, newColumn] };
                    case 'COLUMN_DELETED':
                        showNotification(`A column was deleted`);
                        return { ...currentBoard, columns: currentBoard.columns.filter(c => c.id !== payload.columnId) };
                    case 'CARD_CREATED':
                        showNotification(`Card "${payload.title}" was created`);
                        return {
                            ...currentBoard,
                            columns: currentBoard.columns.map(c =>
                                c.id === payload.column ? { ...c, cards: [...c.cards, payload] } : c
                            )
                        };
                    case 'CARD_DELETED':
                        showNotification(`A card was deleted`);
                        return {
                            ...currentBoard,
                            columns: currentBoard.columns.map(c =>
                                c.id === payload.columnId ? { ...c, cards: c.cards.filter(card => card.id !== payload.cardId) } : c
                            )
                        };
                    case 'CARD_UPDATED':
                        showNotification(`Card "${payload.title}" was updated`);
                        return {
                            ...currentBoard,
                            columns: currentBoard.columns.map(c => ({
                                ...c,
                                cards: c.cards.map(card => card.id === payload.id ? payload : card)
                            }))
                        };
                    default:
                        return currentBoard;
                }
            });
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
        newCardForm.setFieldValue('column', String(columnId));
        openAddCardModal();
    };

    const handleSaveCard = (values) => {
        if (!selectedCard) return;
        axios.patch(`${API_URL}/cards/${selectedCard.id}/`, values)
            .then(() => closeCardModal())
            .catch(err => {
                console.error("Error updating card", err);
                showNotification('Error updating card', 'error');
            });
    };

    const handleCreateCard = (values) => {
        axios.post(`${API_URL}/cards/`, { ...values, board: board.id })
            .then(() => {
                closeAddCardModal();
                newCardForm.reset();
            })
            .catch(err => {
                console.error("Error creating card", err);
                showNotification('Error creating card', 'error');
            });
    };

    const handleCreateColumn = (values) => {
        axios.post(`${API_URL}/columns/`, { ...values, board: board.id, order: board.columns.length })
            .then(() => {
                closeAddColumnModal();
                columnForm.reset();
            })
            .catch(err => {
                console.error("Error creating column", err);
                showNotification('Error creating column', 'error');
            });
    };

    const handleDeleteCard = (cardId) => {
        if (!confirm('Are you sure you want to delete this card?')) return;
        axios.delete(`${API_URL}/cards/${cardId}/`)
            .then(() => closeCardModal())
            .catch(err => {
                console.error("Error deleting card", err);
                showNotification('Error deleting card', 'error');
            });
    };

    const handleDeleteColumn = (columnId) => {
        if (!confirm('Are you sure you want to delete this column? All cards in it will be deleted too.')) return;
        axios.delete(`${API_URL}/columns/${columnId}/`)
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
                .then(() => setIsEditingTitle(false))
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

        const originalBoard = JSON.parse(JSON.stringify(board));
        const sourceColumn = board.columns.find(col => String(col.id) === source.droppableId);
        const destColumn = board.columns.find(col => String(col.id) === destination.droppableId);
        if (!sourceColumn || !destColumn) return;
        
        const sourceCards = Array.from(sourceColumn.cards);
        const [movedCard] = sourceCards.splice(source.index, 1);

        if (source.droppableId === destination.droppableId) {
            sourceCards.splice(destination.index, 0, movedCard);
            const newColumns = board.columns.map(col =>
                String(col.id) === source.droppableId ? { ...col, cards: sourceCards } : col
            );
            setBoard({ ...board, columns: newColumns });
        } else {
            const destCards = Array.from(destColumn.cards);
            destCards.splice(destination.index, 0, movedCard);
            const newColumns = board.columns.map(col => {
                if (String(col.id) === source.droppableId) return { ...col, cards: sourceCards };
                if (String(col.id) === destination.droppableId) return { ...col, cards: destCards };
                return col;
            });
            setBoard({ ...board, columns: newColumns });
        }

        axios.patch(`${API_URL}/cards/${draggableId}/`, { column: destColumn.id })
            .catch(err => {
                console.error("Error moving card! Reverting.", err);
                setBoard(originalBoard);
                showNotification('Error moving card, another user may have changed it.', 'error');
            });
    };

    const getStatusColor = () => {
        switch (readyState) {
            case 1: return 'connected';
            case 0: return 'connecting';
            default: return 'disconnected';
        }
    };

    const connectionStatus = { 0: 'Connecting', 1: 'Connected', 2: 'Closing', 3: 'Disconnected' }[readyState];
    
    if (error) return <div className="error">{error}</div>;
    if (!board) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading board...</div>;

    const columnOptions = board.columns.map(col => ({ value: col.id.toString(), label: col.title }));

    return (
        <>
            {notification && (
                <Notification
                    style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}
                    color={notification.type === 'error' ? 'red' : 'green'}
                    onClose={() => setNotification(null)}
                    icon={notification.type === 'error' ? <IconX /> : <IconCheck />}
                    title={notification.type === 'error' ? 'Error' : 'Success'}
                >
                    {notification.message}
                </Notification>
            )}

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
                                        <ActionIcon color="green" onClick={handleSaveBoardTitle}><IconCheck size={16} /></ActionIcon>
                                        <ActionIcon color="red" onClick={handleCancelEditTitle}><IconX size={16} /></ActionIcon>
                                    </Group>
                                ) : (
                                    <Group spacing="xs">
                                        <Title className="board-title" order={1}>{board.name}</Title>
                                        <ActionIcon onClick={handleEditBoardTitle}><IconEdit size={16} /></ActionIcon>
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
                                    <Button leftIcon={<IconPlus size={16} />} onClick={openAddCardModal} size="sm">Add Card</Button>
                                    <Button leftIcon={<IconPlus size={16} />} variant="outline" onClick={openAddColumnModal} size="sm">Add Column</Button>
                                </Group>
                            </Group>
                        </div>
                    </div>

                    <div className="board">
                        {board.columns?.map(column => (
                            <div key={column.id} className="column">
                                <div className="column-header">
                                    <div>
                                        <Title className="column-title" order={3}>{column.title}</Title>
                                        <Badge className="column-count" variant="filled">{column.cards.length}</Badge>
                                    </div>
                                    <Menu shadow="md" width={200}>
                                        <Menu.Target><ActionIcon><IconDots size={16} /></ActionIcon></Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item icon={<IconPlus size={14} />} onClick={() => handleAddCardClick(column.id)}>Add Card</Menu.Item>
                                            <Menu.Divider />
                                            <Menu.Item color="red" icon={<IconTrash size={14} />} onClick={() => handleDeleteColumn(column.id)}>Delete Column</Menu.Item>
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
                                                <Card key={card.id} card={card} index={index} onClick={() => handleCardClick(card)} />
                                            ))}
                                            {provided.placeholder}
                                            <Button variant="subtle" fullWidth leftIcon={<IconPlus size={16} />} onClick={() => handleAddCardClick(column.id)} className="add-card-btn" size="sm">
                                                Add a card
                                            </Button>
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
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