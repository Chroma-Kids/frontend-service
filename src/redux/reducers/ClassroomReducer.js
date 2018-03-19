import { FETCH_CLASSROOMS } from '../actions/ClassroomActions'

export default function (state = {}, action) {

  switch (action.type) {
    case FETCH_CLASSROOMS:
      return action.payload;
    default:
      return state;
  }
}