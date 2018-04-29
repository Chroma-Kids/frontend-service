import { database } from '../../firebase'
import * as types from './ActionTypes';

export const removeClassroomsListener = () => {
  return dispatch => {
    dispatch({
      type: types.CLASSROOMS_CLEANED,
      payload: database().child('/classrooms/').off()
    });
  }
}

export const removeClassroomListener = (uid) => {
  return dispatch => {
    dispatch({
      type: types.CLASSROOMS_CLEANED,
      payload: database().child('/classrooms/').child(uid).off()
    });
  }
}

export const getClassrooms = () => {
  return dispatch => {
    dispatch({
      type: types.FETCH_CLASSROOMS_PENDING
    });
    database().child('/classrooms/').on('value', snapshot => {
      dispatch({
        type: types.FETCH_CLASSROOMS_FULFILLED,
        payload: snapshot.val()
      });
    }, () => {
      dispatch({
        type: types.FETCH_CLASSROOMS_REJECTED
      });
    });
  };
}

export const fetchClassroom = (uid) => {
  return dispatch => {
    dispatch({
      type: types.FETCH_CLASSROOM_PENDING
    });

    database().child('/classrooms/').child(uid).on('value', function (snapshot, error) {
      if (error)
        dispatch({
          type: types.FETCH_CLASSROOM_REJECTED,
          payload: error
        });
      else
        dispatch({
          type: types.FETCH_CLASSROOM_FULFILLED,
          payload: snapshot.val()
        });
    });
  };
}

export const createClassroom = (classroom) => {

  classroom.created_at = new Date().getTime()/1000;

  return dispatch => {
    dispatch({
      type: types.CREATE_CLASSROOM_PENDING
    });

    database().child('/classrooms/').push({ ...classroom }, function(error) {
      if (error)
        dispatch({
          type: types.CREATE_CLASSROOM_REJECTED,
          payload: error
        });
      else
        dispatch({
          type: types.CREATE_CLASSROOM_FULFILLED
        });
    })
  };
}

export const updateClassroom = (classroom, uid) => {

  classroom.updated_at = new Date().getTime()/1000;

  return dispatch => {
    dispatch({
      type: types.SAVE_CLASSROOM_PENDING
    });

    database().child(`/classrooms/${uid}`).set({...classroom}, function (error) {
      if (error)
        dispatch({
          type: types.SAVE_CLASSROOM_REJECTED,
          payload: error
        });
      else
        dispatch({
          type: types.SAVE_CLASSROOM_FULFILLED,
          payload: classroom
        });
    });
  };
}

/*
* To delete a classroom we need to:
* 1) move the teachers of the classroom to break
* 2) delete the classroom itself
**/
export const deleteClassroom = (classroomId) => {

  return dispatch => {
    dispatch({
      type: types.DELETE_CLASSROOM_PENDING
    });

    database().child(`/classrooms/${classroomId}/teachers`).once('value', (snapshot) => {
      const teachers = Object.keys(snapshot.val() || {});
      teachers.forEach((teacherId) => {
        database().child('/classrooms/').child(classroomId).child('teachers').child(teacherId).remove();
        database().child('/teachers-non-assigned/').child(teacherId).set(true);

        database().child('/teachers/').child(teacherId).child('classrooms').child(classroomId).remove();
      });
    }).then(() => {
      database().child('/classrooms/').child(classroomId).remove();
      dispatch({
        type: types.DELETE_CLASSROOM_FULFILLED,
        payload: false
      });
    }).catch(function(error) {
      dispatch({
        type: types.DELETE_CLASSROOM_REJECTED,
        payload: error
      });
    });
  }
}

/*
* To add a student to a classroom
* 1) we add the student under students in the current classroom
* 2) we add the classroom under classroom(s) in the student path
* 3) we update with a transaction the number of students in the classroom.
*    it allows O(1) in access and calculating ratios
**/
export const addStudentToClassroom = (classroom, student) => {

  // classroom.updated_at = new Date().getTime()/1000;

  return dispatch => {

    dispatch({ type: types.ADD_STUDENT_CLASSROOM_PENDING });

    try {
      // 1) add student to classroom
      database().child('/classrooms').child(classroom).child('students').child(student).set(true);

      // 2) add classroom to student
      database().child('/students').child(student).child('classrooms').child(classroom).set(true);

      // 3) update number of students in classroom
      database().child('/classrooms').child(classroom).child('num_students').transaction(function (current_value) {
        return (current_value || 0) + 1;
      });

      dispatch({ type: types.ADD_STUDENT_CLASSROOM_FULFILLED });
    }
    catch(error) {
      dispatch({ type: types.ADD_STUDENT_CLASSROOM_REJECTED });
    }
  };
}

/*
* To add a student to a classroom
* 1) we remove the student from students in the current classroom
* 2) we remove the classroom from classroom(s) in the student path
* 3) we update with a transaction the number of students in the classroom.
*    it allows O(1) in access and calculating ratios
**/
export const deleteStudentFromClassroom = (classroom, student) => {

  // classroom.updated_at = new Date().getTime()/1000;

  return dispatch => {
    dispatch({
      type: types.REMOVE_STUDENT_CLASSROOM_PENDING
    });

    // 1) remove student from classroom
    database().child(`/classrooms/${classroom}`).child('students').child(student).remove(function(error){
      if (error) {
        dispatch({
          type: types.REMOVE_STUDENT_CLASSROOM_REJECTED,
          payload: error.message
        });
      }else {
        // 2) remove classroom from student
        database().child('/students/').child(student).child('classrooms').child(classroom).remove();

        // 3) update number of students in classroom
        database().child(`/classrooms/${classroom}`).child('num_students').transaction(function (current_value) {
          return (current_value || 0) - 1;
        });

        dispatch({
          type: types.REMOVE_STUDENT_CLASSROOM_FULFILLED,
          payload: classroom
        });
      }
    })
  };
}
