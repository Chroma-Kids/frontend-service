import { database } from '../../firebase';
import * as types from './ActionTypes';

export function getTeachers() {
  return dispatch => {
    dispatch({
               type: types.TEACHER_STATUS,
               payload: true,
             });
    database.ref('teachers/').on('value', snapshot => {
      dispatch({
                 type: types.FETCH_TEACHERS,
                 payload: snapshot.val(),
               });
      dispatch({
                 type: types.TEACHER_STATUS,
                 payload: false,
               });
    }, () => {
      dispatch({
                 type: types.TEACHER_STATUS,
                 payload: -1,
               });
    });
  };
}

export function createTeacher(teacher) {
  return {
    type: types.CREATE_TEACHER,
    payload: (() => {
      const ref = database.ref('teachers/').push({ ...teacher });
      database.ref('teachers-non-assigned/').child(ref.key).set(true);
    })(),
  };
}

export function saveTeacher(teacher, uid) {
  return {
    type: types.SAVE_TEACHER,
    payload: database.ref('teachers/').push({ ...teacher, uid }),
  };
}

/*
* Whenever we delete we must update
*   classrooms/XXXX/teachers/{teacherid}
*   teachers-not-assigned/{teacherid}
*   teachers/{teacherid}
**/
export function deleteTeacher(id) {
  return {
    type: types.DELETE_TEACHER,
    payload: (() => {
      database.ref('teachers/').child(id).remove();
      database.ref('teachers-non-assigned/').child(id).remove();
    })(),
  };
}

/*
* There are three alternatives to move a teacher within the nursery 
* 1) From a classroom to another classroom: there is a from-classroom and also a to-classroom.
*    Remove teacher from from-classroom and add it to to-classroom.
*
* 2) From break-time area to a classroom: there is a to-classroom.
*    Remove teacher from break-time area and add it to to-classroom.
*
* 3) From clasroom to break-time area: there is a from-classroom.
*    Remove teacher from from-classroom and add it to break-time area.
**/
export function moveTeacherToClassroom(teacher, from, to) {
  return {
    type: types.MOVE_TEACHER_TO_CLASSROOM,
    payload: (() => {
      if (typeof from !== "undefined" && typeof to !== "undefined") {
        // 1) from a classroom to another classroom
        database.ref('classrooms/').child(from).child('teachers').child(teacher).remove();
        database.ref('classrooms/').child(to).child('teachers').child(teacher).set(true);
      }
      else if (typeof to !== "undefined") {
        // 2) from the break-time area to a classroom
        database.ref('teachers-non-assigned/').child(teacher).remove();
        database.ref('classrooms/').child(to).child('teachers').child(teacher).set(true);
      }
      else {
        // 3) from a classroom to the break-time area
        database.ref('classrooms/').child(from).child('teachers').child(teacher).remove();
        database.ref('teachers-non-assigned/').child(teacher).set(true);
      }
    })(),
  };
}
