import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Paper, Text, Group, ActionIcon } from '@mantine/core';
import { GripVertical } from 'tabler-icons-react'; // Import an icon for the handle

export function Card({ card, index, onClick }) {
  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided) => (
        <Paper
          shadow="sm"
          p="sm"
          mb="sm"
          ref={provided.innerRef}
          {...provided.draggableProps} 
        >
          <Group position="apart" >
            {/* This div is now the clickable area */}
            <div onClick={onClick} style={{ cursor: 'pointer', flexGrow: 1 }}>
              <Text>{card.title}</Text>
            </div>

            {/* This div is the dedicated drag handle */}
            <div {...provided.dragHandleProps}>
              <ActionIcon variant="transparent" size="lg">
                <GripVertical size={20} />
              </ActionIcon>
            </div>
          </Group>
        </Paper>
      )}
    </Draggable>
  );
}