var tasks = {};

var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>").addClass("m-1").text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: [],
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// event delegation for <p> list items.
$(".list-group").on("click", "p", function () {
  var text = $(this).text().trim();
  // since the use of html syntax, this indicates that an element is to be created.
  var textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");

  // console.log(text);
});

$(".list-group").on("blur", "textarea", function () {
  // get the textarea's current value/text.
  var text = $(this).val().trim();

  // get the parents ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task's position in the list of other li elements.
  var index = $(this).closest(".list-group-item").index();

  // Save the new updated values to tasks object
  // Let's digest this one step at a time:
  // tasks is an object.
  // tasks[status] returns an array (e.g., toDo).
  // tasks[status][index] returns the object at the given index in the array.
  // tasks[status][index].text returns the text property of the object at the given index.

  tasks[status][index].text = text;
  saveTasks();

  //recreate p element
  var taskP = $("<p>").addClass("m-1").text(text);

  // replace textarea with p element.
  $(this).replaceWith(taskP);
});

// due date was clicked
$(".list-group").on("click", "span", function () {
  // get current text
  var date = $(this).text().trim();

  // create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  // swap out element
  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker.
  dateInput.datepicker({
    minDate: 1,
    onClose: function () {
      // when calendar is closed, force a "change" event on the 'dataInput'.
      $(this).trigger("change");
    },
  });

  // automatically focus on new element.
  dateInput.trigger("focus");
});

// value of due date was changed.
$(".list-group").on("change", "input[type='text']", function () {
  // get current text
  var date = $(this).val().trim();

  // get parents ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task's postion in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  // update task in array and re-save to localStorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes.
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // Pass task's <li> element into auditTasks() to check new due date.
  auditTask($(taskSpan).closest(".list-group-item"));
});

// Using the Sortable Jquery UI method, to turn list-group items into a sortable list.
// The activate and deactivate events trigger once for all connected lists as soon as dragging starts and stops.

// The over and out events trigger when a dragged item enters or leaves a connected list.

// The update event triggers when the contents of a list have changed (e.g., the items were re-ordered, an item was removed, or an item was added).
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function (event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function (event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function (event) {
    // console.log("over", event.target);
    $(event.target).addClass("dropover-active");
  },
  out: function (event) {
    // console.log("out", event.target);
     $(event.target).removeClass("dropover-active");
  },
  update: function (event) {
    // array to store the task data in.
    var tempArr = [];

    // loop over current set of children in sortable list
    $(this)
      .children()
      .each(function () {
        var text = $(this).find("p").text().trim();

        var date = $(this).find("span").text().trim();

        // add task data to the temp array as an object
        tempArr.push({
          text: text,
          date: date,
        });
      });

    // trim down list's ID to match object property.
    var arrName = $(this).attr("id").replace("list-", "");

    // update array on tasks object and save.
    tasks[arrName] = tempArr;
    saveTasks();
  },
});

var auditTask = function (taskEl) {
  // get date from task element.
  var date = $(taskEl).find("span").text().trim();

  // convert to moments object at 5:00pm.(Work our normally end around 5PM/ 17:00)
  var time = moment(date, "L").set("hour", 17);

  // remove any old classes from element.
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near/over due date.
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  }
  // calculate the difference in days from current date. if < 2, add warning class.
  else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

setInterval(function () {
  $(".card .list-group-item").each(function (index, el) {
    auditTask(el);
  });
}, 1000 * 60 * 30);

$("#modalDueDate").datepicker({
  minDate: 1,
});
// red drop area to remove list items.
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function (event, ui) {
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function (event, ui) {
  $(".bottum-trash").addClass("bottom-trash-active");
  },
  out: function (event, ui) {
  $(".bottom-trash").removeClass("bottom-trash-active");
  },
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate,
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();
