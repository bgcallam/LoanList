// http://stackoverflow.com/questions/14462962/meteor-mongodb-error-cannot-apply-addtoset-modifier-to-non-array
// http://www.packtpub.com/getting-started-with-meteor-javascript-framework/book
lists = new Meteor.Collection("Lists");

if (Meteor.isClient) {
Meteor.subscribe("Categories");
Meteor.autosubscribe(function() {
	Meteor.subscribe("listdetails", Session.get('current_list'));
});
/*  
  Template.hello.events({
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  });
*/
  Template.categories.lists = function() {
    return lists.find({},{sort: {Category: 1}});
  };
  
  // Declaring the 'adding_category' flag Session.set('adding_category', false);
  // This returns true if adding_category is true
  Template.categories.new_cat = function () {
    return Session.equals('adding_category',true);
  };
  
  // client events
  Template.categories.events({
    // Looking for click even on #btnNewCat
    'click #btnNewCat' : function(e,t) {
      // Set session variable to true
      Session.set('adding_category', true); 
      // Flush the DOM
      Meteor.flush();
      // Move the focus to the input box (t is the DOM?)
      focusText(t.find("#add-category"));
    },
    // user hits enter to add category
    'keyup #add-category' : function (e,t) {
      // checks the 'enter' key
      if(e.which == 13) {
        // check to see if there is any value in the field
        var catVal = String(e.target.value || "");
        if(catVal) {
          //lists.insert({Category:catVal}); **** below was changed to initialize items as array, not list
          lists.insert({Category:catVal,items:[]});
          Session.set('adding_category', false);
        }
      }
    },
    // remove focus after add-category or focus is lost
    'focusout #add-category' : function(e,t){
      Session.set('adding_category',false);
    },
    'click .category' : selectCategory
  }); //-----end events
  
  ///// --------- Generic Helper Functions -------- /////
  // Moves cursor to new focus
  function focusText(i) {
    i.focus();
    i.value = val ? val : " ";
    i.select();
  };
  
  function selectCategory(e,t){
    Session.set('current_list', this._id);
  };
  
  function addItem(list_id, item_name){
    if (!item_name && !list_id){ return;}
    // MongoDB: find list_id then use $addToSet (mongodb command)
    //   equiv to "item.Name = item_name"
    lists.update({_id:list_id}, {$addToSet: {items: {Name: item_name}}});
  };
  
  function removeItem(list_id, item_name){
    if(!item_name && !list_id) {return;}
    // MongoDB: $pull removes the item
    lists.update({_id:list_id}, {$pull: {items: {Name:item_name}}});
  };
  
  function updateLendee(list_id, item_name, lendee_name){
    var l = lists.findOne({"_id" : list_id, "items.Name" : item_name});
    if (l && l.items) {
      for( var i=0; i<l.items.length; i++) {
        if (l.items[i].Name === item_name){
          l.items[i].LentTo = lendee_name;}
      }
    }
    lists.update({"_id" : list_id}, {$set: {"items" : l.items}});
  };
  
  Template.list.items = function() {
    // if there is no list selected (Don't understand this Meteor session var) return null
    if(Session.equals('current_list',null)) {
      console.log("current_list = null for somereason");
      return null;
    }
    else {
      var cats = lists.findOne({_id:Session.get('current_list')});
          if(cats&&cats.items) {
        for(var i=0;i<cats.items.length;i++) {
          var d = cats.items[i];
          // if d.LentTo exists (it is lent to someone) then assign to lendee
          d.Lendee = d.LentTo ? d.LentTo : "free";
          // if d.LentTo exists then assign LendClass (Bootstrap) to the label-important
          // ----> label-important seems to be depreciated, use label-warning if broken
          d.LendClass = d.LentTo ? "label-warning" : "label-success";
        }
        return cats.items;
      }
    }
  };
  
  Template.list.list_selected = function() {
    return ((Session.get('current_list') != null) && (!Session.equals('current_list',null)));
  };
  
  // list_status is used to tell the category button whether it should show as selected.
  Template.categories.list_status = function() {
    // "this" refers to the MongoDB record. The "context" is implied to be the list/category element
    //  from where the template was called (cool!)
    if (Session.equals('current_list', this._id))
      return "";
    else
      return " btn-inverse";
  };
  
  // Are we adding to the list?
  Template.list.list_adding = function() {
    return (Session.equals('list_adding',true));
  };
    
  Template.list.lendee_editing = function() {
    return (Session.equals('lendee_input',this.Name));
  };
  
  Template.list.events({
    'click #btnAddItem' : function(e,t){
      Session.set('list_adding',true);
      Meteor.flush();
      focusText(t.find("#item_to_add"));
    },
    'keyup #item_to_add' : function(e,t){
      // using triple = because this is a keystroke
      if(e.which === 13) {
        addItem(Session.get('current_list'),e.target.value);
        Session.set('list_adding',false);
      }
    },
    'focusout #item_to_add' : function(e,t){
      Session.set('list_adding',false);
    },
    'click .delete_item' : function(e,t){
      removeItem(Session.get('current_list'),e.target.id);
    },
    'click .lendee' : function(e,t){
      Session.set('lendee_input', this.Name);
      Meteor.flush();
      focusText(t.find("#edit_lendee"), this.LentTo);
    },
    'keyup #edit_lendee' : function(e,t){
      if(e.which === 13) {
        updateLendee(Session.get('current_list'), this.Name, e.target.value);
        Session.set('lendee_input',null);
      }
      if(e.which === 27) {
        Session.set('lendee_input',null);
      }
    }
  });
    
} //-----------------closing bracket for Meteor.isClient

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
Meteor.publish("Categories", function() {
	return lists.find({},{fields:{Category:1}});
});

Meteor.publish("listdetails", function (category_id){
	return lists.find({_id:category_id});
});

}
