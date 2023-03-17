import { FC, PropsWithChildren } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { useAppContext } from '../../context/AppContext';
import CustomButton from '../../ui/CustomButton';
import { StarIcon } from '@chakra-ui/icons';

const border = '1px solid';

type ListItemProps = {
  onClick: () => void;
  isSelected: boolean;
};

const ListItem: FC<PropsWithChildren<ListItemProps>> = ({
  onClick,
  children,
  isSelected,
}) => (
  <Box
    cursor={'pointer'}
    borderTop={isSelected ? border : ''}
    borderLeft={isSelected ? border : ''}
    borderRight={isSelected ? border : ''}
    borderBottom={!isSelected ? border : ''}
    borderColor="#E2E8F0"
    p={3}
    onClick={onClick}
  >
    {children}
  </Box>
);

type ListsProps = {
  setIsAddingTaskToFalse: () => void;
  setIsAddingOrEditingListToTrue: () => void;
};

const Lists: FC<ListsProps> = ({
  setIsAddingTaskToFalse,
  setIsAddingOrEditingListToTrue,
}) => {
  const { lists, setSelectedListId, selectedListId, getPrioritizedTasks } =
    useAppContext();
  const isFavoriteListSelected = !selectedListId;

  return (
    <>
      <ListItem
        onClick={() => {
          setIsAddingTaskToFalse();
          getPrioritizedTasks();
          setSelectedListId(undefined);
        }}
        isSelected={isFavoriteListSelected}
      >
        <StarIcon color={'orange'} boxSize={5} />
      </ListItem>

      {lists.map(({ title, _id }) => {
        const isSelected = selectedListId === _id;

        return (
          <ListItem
            key={_id}
            onClick={() => {
              setIsAddingTaskToFalse();
              setSelectedListId(_id);
            }}
            isSelected={isSelected}
          >
            <Text
              noOfLines={1}
              textAlign={'center'}
              color={isSelected ? 'blue.500' : ''}
            >
              {title}
            </Text>
          </ListItem>
        );
      })}
      <Box px={2}>
        <CustomButton
          variant="outline"
          colorScheme="blue"
          onClick={setIsAddingOrEditingListToTrue}
        >
          nouvelle liste
        </CustomButton>
      </Box>
    </>
  );
};

export default Lists;
