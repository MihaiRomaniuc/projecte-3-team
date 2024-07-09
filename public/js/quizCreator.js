var socket = io();
var questionNum = 1;

function updateDatabase() {
    var questions = [];
    var name = document.getElementById('name').value;
    for (var i = 1; i <= questionNum; i++) {
        var question = document.getElementById('q' + i).value;
        var answer1 = document.getElementById(i + 'a1').value;
        var answer2 = document.getElementById(i + 'a2').value;
        var answer3 = document.getElementById(i + 'a3').value;
        var answer4 = document.getElementById(i + 'a4').value;
        var correct = document.getElementById('correct' + i).value;
        var answers = [answer1, answer2, answer3, answer4];
        questions.push({ "question": question, "answers": answers, "correct": correct })
    }

    var quiz = { id: 0, "name": name, "questions": questions };
    socket.emit('newQuiz', quiz);
}

function addQuestion() {
    questionNum += 1;

    var questionsDiv = document.getElementById('allQuestions');

    var newQuestionDiv = document.createElement("div");
    newQuestionDiv.setAttribute("id", "question-field" + questionNum);
    newQuestionDiv.classList.add('question-field');

    var questionLabel = createLabel("Pregunta " + questionNum + ":");
    var questionField = createInput('text', 'form-control', 'q' + questionNum);

    var row1 = createRow(
        createCol(createLabel("Respuesta 1:"), "col-md-6"),
        createCol(createLabel("Respuesta 2:"), "col-md-6")
    );

    var answer1Field = createInput('text', 'form-control', questionNum + "a1");
    var answer2Field = createInput('text', 'form-control', questionNum + "a2");

    row1.appendChild(createCol(answer1Field, "col-md-6"));
    row1.appendChild(createCol(answer2Field, "col-md-6"));

    var row2 = createRow(
        createCol(createLabel("Respuesta 3:"), "col-md-6"),
        createCol(createLabel("Respuesta 4:"), "col-md-6")
    );

    var answer3Field = createInput('text', 'form-control', questionNum + "a3");
    var answer4Field = createInput('text', 'form-control', questionNum + "a4");

    row2.appendChild(createCol(answer3Field, "col-md-6"));
    row2.appendChild(createCol(answer4Field, "col-md-6"));

    var correctLabel = createLabel("Respuesta Correcta (1-4):");
    var correctField = createInput('number', 'form-control', 'correct' + questionNum);
    correctField.classList.add('correct');

    var deleteButton = createButton('Eliminar', 'btn btn-danger mt-2', deleteQuestion);
    deleteButton.setAttribute('data-question', questionNum);

    newQuestionDiv.appendChild(questionLabel);
    newQuestionDiv.appendChild(questionField);
    newQuestionDiv.appendChild(row1);
    newQuestionDiv.appendChild(row2);
    newQuestionDiv.appendChild(correctLabel);
    newQuestionDiv.appendChild(correctField);
    newQuestionDiv.appendChild(deleteButton);

    questionsDiv.appendChild(newQuestionDiv);
}

function cancelQuiz() {
    if (confirm("¿Seguro que quieres salir? ¡Todo el trabajo será ELIMINADO!")) {
        window.location.href = "../../../";
    }
}

socket.on('startGameFromCreator', function (data) {
    window.location.href = "../../host/?id=" + data;
});

function createLabel(text) {
    var label = document.createElement('label');
    label.textContent = text;
    return label;
}

function createInput(type, className, id) {
    var input = document.createElement('input');
    input.setAttribute('type', type);
    input.classList.add(className);
    input.setAttribute('id', id);
    return input;
}

function createLineBreak(count) {
    var lineBreaks = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
        lineBreaks.appendChild(document.createElement('br'));
    }
    return lineBreaks;
}

function createRow(...columns) {
    var rowDiv = document.createElement("div");
    rowDiv.classList.add("row", "mt-2");

    columns.forEach((col) => {
        rowDiv.appendChild(col);
    });

    return rowDiv;
}

function createCol(content, colClass) {
    var colDiv = document.createElement("div");
    colDiv.classList.add("col-md-6");

    colDiv.appendChild(content);

    return colDiv;
}

function createButton(text, classNames, clickHandler) {
    var button = document.createElement('button');
    button.textContent = text;

    classNames.split(' ').forEach(function (className) {
        button.classList.add(className);
    });

    button.onclick = clickHandler;
    return button;
}

function deleteQuestion() {
    var questionNumberToDelete = this.getAttribute('data-question');
    var questionDivToDelete = document.getElementById('question-field' + questionNumberToDelete);

    if (questionDivToDelete) {
        questionDivToDelete.remove();
        questionNum -= 1; // Reducir el número total de preguntas
    }
}
