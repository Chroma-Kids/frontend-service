import configureMockStore from 'redux-mock-store'
import * as firebase from 'firebase';
import firebaseTest from '../../../firebase/firebaseTestConfig';
import { database } from '../../../firebase/firebase';
import thunk from 'redux-thunk';
import { exampleData } from '../../../../__test__/mockData'

import { deleteStudent, createStudent } from '../StudentActions';
import { addStudentToClassroom } from '../ClassroomActions';

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

beforeAll(() => {
  global.testRef = 'TestingPath';
  global.ref = firebase.database().ref('TestingPath');
  global.store = mockStore(exampleData);
});

afterAll(async (done) => {
  delete global.testRef;
  await ref.remove();
  delete global.ref;
  done();
});

describe('Create a student', () => {
  it('added to the list of students', async () => {

    await ref.set(exampleData);

    const new_student = {
      "name" : "Angel",
      "surname" : "Suarez"
    };

    global.store.dispatch(createStudent(new_student));

    const db = await ref.child('/students').once('value');
    const classrooms = Object.keys(db.val() || {});
    expect(classrooms).toHaveLength(5);
  })
})

describe('Delete a student', () => {
  it('remove him/her from the list of students', async () => {

    await ref.set(exampleData);

    global.store.dispatch(deleteStudent("-L8mfM0RSKdKqwWB6qtz"));

    const db = await ref.child('/students').child("-L8mfM0RSKdKqwWB6qtz").once('value');
    expect(db.val()).toBeNull();

  })

  it('remove him/her from the classrooms', async () => {

    await ref.set(exampleData);

    const classrooms_ref = await ref.child('/students').child("-L8mfM0RSKdKqwWB6qtz").child('/classrooms').once('value');

    const classrooms = Object.keys(classrooms_ref.val() || {});

    global.store.dispatch(deleteStudent("-L8mfM0RSKdKqwWB6qtz"));

    const db1 = await ref.child('/classrooms').child("-L8nQ8kBCYfZizh2cshQ").child('/students').once('value');
    expect(db1.val()).toBeNull();

    const db2 = await ref.child('/classrooms').child("-L8qcB1PlvlViNVjRP28").child('/students').once('value');
    const db2_values = Object.keys(db2.val() || {});
    expect(db2_values).toHaveLength(3);

    const db3 = await ref.child('/classrooms').child("-L9bR7ld-_m2IRA5V-jb").child('/students').once('value');
    const db3_values = Object.keys(db3.val() || {});
    expect(db3_values).toHaveLength(1);

  })

  it('it cant be found in the list anymore', async () => {
    const db = await ref.child('/students').child("-L8mfM0RSKdKqwWB6qtz").once('value');
    expect(db.val()).toBeNull();
  })
})

describe('Add student to classroom', () => {
  it('the student appears in the list of students of the classroom', async () => {

    await ref.set(exampleData);

    global.store.dispatch(addStudentToClassroom("-L8nQ8kBCYfZizh2cshQ", "-L9bROFNpP4RgEP8YiAh"));

    const db = await ref.child('/classrooms').child('-L8nQ8kBCYfZizh2cshQ').child('students').once('value');
    const students = Object.keys(db.val() || {});
    expect(students).toContainEqual("-L9bROFNpP4RgEP8YiAh");
  })
  it('the classroom appears in the list of classrooms of the student ', async () => {
    const db = await ref.child('/students').child('-L9bROFNpP4RgEP8YiAh').child('classrooms').once('value');
    const classrooms = Object.keys(db.val() || {});
    expect(classrooms).toContainEqual("-L8nQ8kBCYfZizh2cshQ");
  })
  it('the counter of number of students in the classroom is 2', async () => {
    const db = await ref.child('/classrooms').child('-L8nQ8kBCYfZizh2cshQ').child('num_students').once('value');
    expect(db.val()).toEqual(2);
  })
})