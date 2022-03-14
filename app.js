// See Module 26 (EJS) todolist-v1 for notes that are unrelated to mongodb interactions


/*****************Imports****************/
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();


/*****************Setups****************/
app.set("view engine", "ejs");
app.use(express.static("public")); 
app.use(bodyParser.urlencoded({extended: true}));
mongoose.connect("mongodb+srv://Admin-Sam:Th3Dw3ll3r@cluster0.fjxyy.mongodb.net/todoListDB?retryWrites=true&w=majority", {useNewUrlParser: true});
mongoose.pluralize(null);


/*****************Mongoose Variables****************/
const itemSchema = { // Structure document of a Model
    name: String
}; 
const Item = mongoose.model("items", itemSchema); // The Model itself (not auto-pluralized, thank god)

const listSchema = {
    name: String,
    items: [itemSchema] // "An array of elements of the form 'itemSchema'"
};
const List = mongoose.model("lists", listSchema);

const flagSchema = {
    name: String,
    value: Boolean
};
const Flag = mongoose.model("flags", flagSchema);

/*****************Default Todo Items****************/
Flag.find({name: "Initialized"}, function(err, flagQuery){ // Find is asynchronous, so the if statement needs to be in it's callback function.
    if (flagQuery.length === 0) { // If no flags exist, create one and pass the value "false" to enter the next if.
        const flag = new Flag({
            name: "Initialized",
            value: true
        });
        flag.save();

        flagQuery.value = false;
    }
    
    if (flagQuery.value === false){
        const item1 = new Item({ // Populating the default list with tips on the first use.
            name: "Welcome to your todo list!"
        });
        const item2 = new Item({
            name: "Hit the + button to add a new item."
        });
        const item3 = new Item({
            name: "<-- Hit this to delete an item."
        });
    
        const defaultItems = [item1, item2, item3];
        const initTodayList = new List({
            name: "Today",
            items: defaultItems
        });
        initTodayList.save();
    }
});


/*****************Routing****************/
app.get("/", function(req, res){
    res.redirect("/Today"); // Default list name for the home route
});

app.get("/:listTitle", function(req, res){ // We handle every possible lists here
    const listTitle = req.params.listTitle;
    let listItems = [];
    const listList = []; // A list of all the existing lists

    List.find({}, function(err, docs){ // Find all existing lists
        docs.forEach(function(list){
            listList.push(list.name); // and send their names over to list.ejs
        });
    })

    List.findOne({name: listTitle}, function(err, list){ // MUST use findOne, or else list is an array and not a single object.
        if (list) {
            listItems = list.items;
        }

        List.find({}, function(err, listDocs){
            listDocs.forEach(function(listSingle){
                if (listSingle.items.length === 0) {
                    listSingle.remove();
                }
            });
        });
        res.render("list", {listTitle: listTitle, listItems: listItems, listList: listList});
    });
});


app.post("/", function(req, res){
    
    const itemName = req.body.newListElem;
    const listTitle = req.body.listTitle;
    
    const newItem = new Item({
        name: itemName
    });

    List.findOne({name: listTitle}, {}, {}, function(err, doc){
        if (!doc) {
            const newList = new List({
                name: listTitle,
                items: [newItem]
            });
            newList.save();
        } else {
            List.updateOne({name: listTitle}, {$push: {items :newItem}}, {}, function(err, docs){
            });
        }
        res.redirect("/" + listTitle);
    })

    
});

app.post("/changelist", function(req, res){
    res.redirect("/" + req.body.changeTo);
})

app.post("/delete", function(req, res){
    const itemId = req.body.checkbox;
    const listTitle = req.body.listTitle;

    List.updateOne({name: listTitle}, {$pull: {items: {_id: itemId}}}, {}, function(){
        res.redirect("/" + listTitle);
    });
});

let port = process.env.PORT;
if (port === null || port === "") {
    port = 3000;
}
app.listen(port);