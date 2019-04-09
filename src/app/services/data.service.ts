import { Injectable } from '@angular/core';
import { UIService } from '../services/ui.service';
import * as firebase from 'firebase';
import { Events } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  UIs = [];
  UI_ref = firebase.database().ref('UI_Collections/');
  User_ref = firebase.database().ref('UserUIs');

  constructor( public events: Events ) 
  { 
    this.UI_ref.on('value', resp => {
      this.UIs = [];
      this.UIs = snapshotToArray(resp);
      this.events.publish('dataloaded', Date.now());
    })
  }

  pushToFirebase(ui: UIService)
  {
    let randomId = Math.random().toString(36).substr(2, 5);
    if(ui.getPublic()){
      this.UI_ref.push({
        "ownerid":ui.getOwnerID(), 
        "name":ui.getName(), 
        "description": ui.getDescription(),
        "publish": ui.getPublic(),
        "objects": JSON.parse(JSON.stringify(ui.getObjects())),
        "uniqueid":randomId
      });
    }
    this.addToUserCollection(randomId, ui.getName());
  }

  addToUserCollection(id, name)
  {
    this.User_ref.push({
        "uniqueid":id,
        "uid": this.getUserID(),
        "name":name
    })
  }
  
  // deleteById(id:number)
  // {
  //   firebase.database().ref('UI_Collections/'+id).remove();
  // }

  // deleteUI(currentItem)
  // {
  //   let newInfo = firebase.database().ref('UI_Collections'+currentItem.id).remove();
  // }

  // deleteByName(name:string)
  // {
  //   var id;
  //   this.UI_ref.orderByChild('name').equalTo(name).on("value",function(data){
  //       data.forEach(function(data){
  //         id = data.val().key;
  //     })
  //   })
  //   this.deleteById(id);
  // }

  // editUI(currentItem)
  // {
  //   let newInfo = firebase.database().ref('UIs/'+currentItem.id).update(currentItem);
  // }

  getUserID(){ return firebase.auth().currentUser.uid; }

  //return the UIs associated with the user's ID
  getUIs(id){
    var UIs = [];
    this.User_ref.orderByChild('uid').equalTo(id).on("value",function(data){
      data.forEach(function(data){
          UIs.push({
            'name':data.val().name,
            'uniqueid':data.val().uniqueid,
          });
        });
      })
    console.log(UIs);
    return UIs;
  }

  idToObj(obj_id)
  {
    console.log("Searching for "+obj_id);
    var ui:UIService;
    this.UI_ref.orderByChild('uniqueid').equalTo(obj_id).on("value",function(data){
          data.forEach(function(data){
            var temp = new UIService(data.val().name, data.val().description, data.val().publish);
            temp.setOwnerID(data.val().ownerid);
            for(var i = 0; i < data.val().objects.length; i++)
            {
              var obj = data.val().objects[i];
              if(obj._type=="switch")
                temp.objectFactory(obj._type, obj._row, obj._col, <number>obj._channel, <number>obj._value, <number>obj._value2);
              else
                temp.objectFactory(obj._type, obj._row, obj._col, <number>obj._channel, <number>obj._value);
            }
            ui = temp;
          })
        })
    return ui;
  }
}
export const snapshotToArray = snapshot => {
  let returnArr = [];

  snapshot.forEach(childSnapshot => {
      let item = childSnapshot.val();
      item.id = childSnapshot.key;
      returnArr.push(item);
  });

  return returnArr;
}

