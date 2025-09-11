import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Paper, Text, Group, ActionIcon, Badge, Stack } from '@mantine/core';
import { IconGripVertical, IconCalendar, IconUser } from '@tabler/icons-react';

export function Card({ card, index, onClick }) {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided, snapshot) => (
        <Paper
          shadow={snapshot.isDragging ? "lg" : "sm"}
          p="md"
          mb="sm"
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`card ${snapshot.isDragging ? 'dragging' : ''}`}
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging 
              ? `${provided.draggableProps.style?.transform} rotate(3deg)`
              : provided.draggableProps.style?.transform,
          }}
        >
          <div className="card-content">
            <div className="card-main" onClick={onClick}>
              <Stack spacing="xs">
                <Text 
                  className="card-title" 
                  weight={600} 
                  size="sm"
                  lineClamp={2}
                >
                  {card.title}
                </Text>
                
                {card.description && (
                  <Text 
                    className="card-description" 
                    size="xs" 
                    color="dimmed"
                    lineClamp={3}
                  >
                    {card.description}
                  </Text>
                )}

                {/* Card Meta Information */}
                <Group position="apart" mt="xs">
                  <Group spacing="xs">
                    {card.due_date && (
                      <Badge 
                        size="xs" 
                        variant="outline"
                        color={isOverdue(card.due_date) ? "red" : "blue"}
                        leftSection={<IconCalendar size={10} />}
                      >
                        {formatDate(card.due_date)}
                      </Badge>
                    )}
                  </Group>
                  
                  <Group spacing="xs">
                    {card.created_at && (
                      <Text size="xs" color="dimmed">
                        {formatDate(card.created_at)}
                      </Text>
                    )}
                  </Group>
                </Group>
              </Stack>
            </div>

            {/* Drag Handle */}
            <div 
              {...provided.dragHandleProps}
              className="drag-handle"
            >
              <ActionIcon 
                variant="transparent" 
                size="sm"
                style={{ opacity: 0.6 }}
              >
                <IconGripVertical size={16} />
              </ActionIcon>
            </div>
          </div>
        </Paper>
      )}
    </Draggable>
  );
}