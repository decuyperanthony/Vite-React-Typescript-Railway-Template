import { FC, ChangeEvent, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';

import React, { createContext, useContext, useMemo } from 'react';
import fetcher, { instance } from '../service/config';
import { LIST_URL, TASK_URL } from '../service/endPoint';
import { List } from '../Models/list';
import { Task, TaskStatus } from '../Models/task';
import { useBoolean } from '@chakra-ui/react';

type ResTaskAPI = {
  ok: true;
  data: Task[];
};

const initTaskState = {
  name: '',
  status: 'OPEN' as TaskStatus,
};
const initListState = {
  title: '',
};

type ResListAPI = {
  ok: true;
  data: List[];
};

type Context = {
  lists: List[];
  isLoading: boolean;
  tasks: Task[];
  updatedTask: Omit<Task, '_id'>;
  selectedListId?: string;
  addTask: () => Promise<void>;
  addList: (setIsAddingOrEditingList: {
    on: () => void;
    off: () => void;
  }) => Promise<void>;
  onClickOnEditList: () => void;
  onResetListFormState: () => void;

  newTask: Omit<Task, '_id'>;
  listForm: Omit<List, '_id'> & { _id?: string };
  onAddTaskInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddListInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateTask: (id: string) => void;

  setSelectedListId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setUpdatedTask: React.Dispatch<React.SetStateAction<Omit<Task, '_id'>>>;
  onUpdateTaskInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  deleteTask: (taskId: string) => Promise<void>;
  deleteList: (onClosePopoverDeletelist: () => void) => Promise<void>;
  updateTaskStatus: (
    taskId: string,
    name: string,
    status: TaskStatus
  ) => Promise<void>;
};

const AppContext = createContext<Context>({} as Context);

export const useAppContext = (): Context => useContext(AppContext);

type Props = {
  children: React.ReactNode;
};

// todo les loaders
// todo les errors

const AppContextWrapper: FC<Props> = ({ children }) => {
  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>();
  const [isFecthing, setIsFetching] = useBoolean();

  const [newTask, setNewTask] = useState<Omit<Task, '_id'>>(initTaskState);
  const [updatedTask, setUpdatedTask] =
    useState<Omit<Task, '_id'>>(initTaskState);
  const [listForm, setListForm] = useState<
    Omit<List, '_id'> & { _id?: string }
  >(initListState);

  const { data: resLists, isLoading: isFetchindList } = useSWR<ResListAPI>(
    LIST_URL,
    fetcher
  );

  const { data: resTask, isLoading: isFetchindTask } = useSWR<ResTaskAPI>(
    selectedListId ? LIST_URL + selectedListId + TASK_URL : null,
    fetcher
  );

  const onUpdateTaskInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setUpdatedTask({ ...updatedTask, name: e.target.value });
    },
    [updatedTask]
  );

  const onAddListInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setListForm({ ...listForm, title: e.target.value });
    },
    [listForm]
  );

  const onClickOnEditList = useCallback(() => {
    setListForm(lists.find(({ _id }) => _id === selectedListId) as List);
  }, [lists, selectedListId]);

  const onAddTaskInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setNewTask({ ...newTask, name: e.target.value });
    },
    []
  );
  console.log({ listForm });

  const onResetUpdatedTaskState = () => setUpdatedTask(initTaskState);
  const onResetAddTaskState = () => setNewTask(initTaskState);
  const onResetListFormState = () => setListForm(initListState);

  // todo mettre ses méthodes dans un hook avec le useState des tasks
  // todo comme cote incube

  const addList = useCallback(
    async (setIsAddingOrEditingList: { on: () => void; off: () => void }) => {
      if (listForm.title === '') return;
      try {
        setIsFetching.on();
        if (listForm?._id) {
          // EDIT MODE
          const res = await instance().put(LIST_URL + selectedListId, listForm);
          if (res.data?.ok) {
            setLists(
              lists.map((list) =>
                list._id === selectedListId ? { ...res.data.data } : { ...list }
              )
            );
            onResetListFormState();
            setIsAddingOrEditingList.off();
          }
        } else {
          // CREATE MODE
          const res = await instance().post(LIST_URL, listForm);
          if (res.data?.ok) {
            const updatedLists = [...lists];
            updatedLists.push(res.data.data);
            setLists(updatedLists);
            setSelectedListId(res.data.data._id);
            onResetListFormState();
            setIsAddingOrEditingList.off();
          }
        }
      } catch (error) {
        // todo trait error
        console.log('error :>> ', error);
      } finally {
        setIsFetching.off();
      }
    },
    [listForm]
  );

  const deleteList = useCallback(
    async (onClosePopoverDeletelist: () => void) => {
      setIsFetching.on();
      try {
        const res = await instance().delete(LIST_URL + selectedListId);

        if (res.status === 204) {
          const updatedLists = lists?.filter(
            ({ _id }) => _id !== selectedListId
          );
          setLists(updatedLists);
          setSelectedListId(updatedLists[0]._id);
          onClosePopoverDeletelist();
        }
      } catch (error) {
        // todo trait error
        console.log('error :>> ', error);
      } finally {
        setIsFetching.off();
      }
    },
    [lists, selectedListId]
  );

  const addTask = useCallback(async () => {
    if (newTask.name === '') return;
    setIsFetching.on();
    try {
      const res = await instance().post(
        TASK_URL + LIST_URL + selectedListId,
        newTask
      );
      if (res.data?.ok) {
        const updatedTasks = [...tasks];
        updatedTasks.push(res.data.data);
        setTasks(updatedTasks);
        onResetAddTaskState();
      }
    } catch (error) {
      // todo trait error
      console.log('error :>> ', error);
    } finally {
      setIsFetching.off();
    }
  }, [newTask]);

  const deleteTask = useCallback(
    async (taskId: string) => {
      setIsFetching.on();
      try {
        const res = await instance().delete(TASK_URL + taskId);

        if (res.status === 204)
          setTasks(tasks?.filter(({ _id }) => _id !== taskId));
      } catch (error) {
        // todo trait error
        console.log('error :>> ', error);
      } finally {
        setIsFetching.off();
      }
    },
    [tasks]
  );

  const updateTask = useCallback(
    async (taskId: string) => {
      setIsFetching.on();
      try {
        const res = await instance().put(TASK_URL + taskId, updatedTask);

        if (res.data?.ok)
          setTasks(
            tasks?.map((task) =>
              task._id === taskId
                ? { ...task, name: updatedTask.name }
                : { ...task }
            )
          );
        onResetUpdatedTaskState();
      } catch (error) {
        // todo trait error
        console.log('error :>> ', error);
      } finally {
        setIsFetching.off();
      }
    },
    [tasks, updatedTask]
  );

  const updateTaskStatus = async (
    taskId: string,
    name: string,
    status: TaskStatus
  ) => {
    setIsFetching.on();
    const updateStatus = status === 'DONE' ? 'OPEN' : 'DONE';
    try {
      await instance().put(TASK_URL + taskId, {
        name,
        status: updateStatus,
      });

      setTasks(
        tasks?.map((task) =>
          task._id === taskId
            ? {
                ...task,
                status: status === 'DONE' ? 'OPEN' : 'DONE',
                name: name,
              }
            : { ...task }
        )
      );
      onResetUpdatedTaskState();
    } catch (error) {
      // todo trait error
      console.log('error :>> ', error);
    } finally {
      setIsFetching.off();
    }
  };

  const isLoading = isFetchindList || isFecthing || isFetchindTask;

  useEffect(() => {
    if (resLists?.data) {
      setSelectedListId(resLists.data[0]._id);
      setLists(resLists.data);
    }
  }, [resLists?.data]);

  useEffect(() => {
    if (resTask?.data) setTasks(resTask.data);
  }, [resTask?.data]);

  const contextValue = useMemo(
    () => ({
      isLoading,
      lists,
      tasks,
      listForm,
      newTask,
      updatedTask,
      addTask,
      addList,
      onClickOnEditList,
      deleteList,
      deleteTask,
      updateTask,
      updateTaskStatus,
      onAddListInputChange,
      onAddTaskInputChange,
      onUpdateTaskInputChange,
      setUpdatedTask,
      setSelectedListId,
      onResetListFormState,
      selectedListId,
    }),
    [
      isLoading,
      lists,
      tasks,
      listForm,
      newTask,
      updatedTask,
      isLoading,
      addTask,
      addList,
      onClickOnEditList,
      deleteList,
      deleteTask,
      updateTask,
      updateTaskStatus,
      onAddListInputChange,
      onAddTaskInputChange,
      onUpdateTaskInputChange,
      setUpdatedTask,
      setSelectedListId,
      onResetListFormState,
      selectedListId,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export default AppContextWrapper;
