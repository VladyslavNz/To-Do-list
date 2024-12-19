import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from './firebaseConfig';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

function TaskListScreen({ navigation }) {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'incomplete'

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tasks"), snapshot => {
      const loadedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text || '',
        description: doc.data().description || '',
        done: doc.data().done || false,
      }));
      setTasks(loadedTasks);
    });
    return unsubscribe;
  }, []);

  const addTask = async () => {
    if (task.trim()) {
      try {
        await addDoc(collection(db, "tasks"), {
          text: task.trim(),
          description: '',
          done: false,
        });
        setTask('');
      } catch (error) {
        console.error("Error adding task: ", error);
      }
    }
  };

  const toggleTaskCompletion = async (id, done) => {
    try {
      const taskDoc = doc(db, "tasks", id);
      await updateDoc(taskDoc, { done: !done });
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  };

  const deleteTask = async (id) => {
    try {
      const taskDoc = doc(db, "tasks", id);
      await deleteDoc(taskDoc);
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.done;
    if (filter === 'incomplete') return !task.done;
    return true; // 'all'
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Your Tasks</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task"
          value={task}
          onChangeText={setTask}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilterButton]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.activeFilterButtonText]}>
            All Tasks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.activeFilterButton]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterButtonText, filter === 'completed' && styles.activeFilterButtonText]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'incomplete' && styles.activeFilterButton]}
          onPress={() => setFilter('incomplete')}
        >
          <Text style={[styles.filterButtonText, filter === 'incomplete' && styles.activeFilterButtonText]}>
            Incomplete
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredTasks}
        renderItem={({ item }) => (
          <View style={styles.taskContainer}>
            <TouchableOpacity
              style={[styles.checkbox, item.done && styles.checkedCheckbox]}
              onPress={() => toggleTaskCompletion(item.id, item.done)}
            />
            <TouchableOpacity
              style={styles.taskContent}
              onPress={() => navigation.navigate('EditTask', {
                taskId: item.id,
                currentText: item.text,
                currentDescription: item.description,
              })}
            >
              <Text style={[styles.taskText, item.done && styles.doneTask]}>{item.text || 'No task text'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Text style={styles.deleteButton}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

function EditTaskScreen({ route, navigation }) {
  const { taskId, currentText, currentDescription } = route.params;
  const [newText, setNewText] = useState(currentText);
  const [newDescription, setNewDescription] = useState(currentDescription);

  const updateTask = async () => {
    try {
      const taskDoc = doc(db, "tasks", taskId);
      await updateDoc(taskDoc, { text: newText, description: newDescription });
      navigation.goBack();
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  };

  return (
    <View style={styles.editContainer}>
      <TextInput
        style={styles.editInput}
        value={newText}
        onChangeText={setNewText}
        placeholder="Edit your task title"
      />
      <TextInput
        style={styles.editInput}
        value={newDescription}
        onChangeText={setNewDescription}
        placeholder="Edit your task description"
        multiline
      />
      <TouchableOpacity style={styles.updateButton} onPress={updateTask}>
        <Text style={styles.updateButtonText}>Update</Text>
      </TouchableOpacity>
    </View>
  );
}

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Task List">
        <Stack.Screen name="Task List" component={TaskListScreen} />
        <Stack.Screen name="EditTask" component={EditTaskScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#173753',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#000',
    borderRadius: 5,
    padding: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#ccc',
  },
  activeFilterButton: {
    backgroundColor: '#173753',
  },
  filterButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  taskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 3,
    marginRight: 10,
  },
  checkedCheckbox: {
    backgroundColor: '#008000',
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
  },
  doneTask: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  deleteButton: {
    color: 'red',
    fontWeight: 'bold',
  },
  editContainer: {
    flex: 1,
    padding: 20,
  },
  editInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  updateButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AppNavigator;
