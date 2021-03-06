import express from "express";
import { promises as fs } from "fs";
import { sum, media } from "../utils/calculator.js";

// The global.fileName is defined to read the file grades.json.
const { readFile, writeFile } = fs;
const router = express.Router();

// Request with id parameters at the endpoint, full data of a given student (4)
router.get("/:id", async (request, response, next) => {
  try {
    const data = JSON.parse(await fs.readFile(global.fileName));

    const filterGrades = data.grades.find((grade) => {
      return grade.id === parseInt(request.params.id);
    });

    response.status(200).send(filterGrades);
    logger.info(`GET /grades/id`);
  } catch (err) {
    next(err);
  }
});

// Request for the total grade of a subject for a given student (5)
router.get("/", async (request, response, next) => {
  let params = request.body;

  try {
    const data = JSON.parse(await fs.readFile(global.fileName));
    const grades = data.grades.filter(
      (grade) =>
        grade.student === params.student && grade.subject === params.subject
    );

    if (!grades || !grades.length) {
      throw new Error("GET - grades not found");
    }

    const soma = sum(grades);

    response.status(200).send({ sum: soma });
    logger.info(`GET /`);
  } catch (err) {
    next(err);
  }
});

// Request average of a subject acordingly with a type (6)
router.get("/subtype/average", async (request, response, next) => {
  let params = request.body;

  try {
    const data = JSON.parse(await fs.readFile(global.fileName));
    const grades = data.grades.filter(
      (grade) => grade.type === params.type && grade.subject === params.subject
    );

    if (!grades || !grades.length) {
      throw new Error("GET - grades not found");
    }

    const average = media(grades);

    response.send({ average: average });
    logger.info(`GET /subtype/average`);
  } catch (err) {
    next(err);
  }
});

// Request the 3 best grades accordingly with a given type and subject (7)
router.get("/subject/type/best", async (request, response, next) => {
  let params = request.body;

  try {
    const data = JSON.parse(await fs.readFile(global.fileName));
    const grades = data.grades.filter(
      (grade) => grade.type === params.type && grade.subject === params.subject
    );

    let best = [];
    const organize = grades.sort((a, b) => b.value - a.value);

    for (let i = 0; i < 3; i++) {
      best.push(organize[i]);
    }

    response.status(200).send(best);
    logger.info(`GET /subject/type/best`);
  } catch (err) {
    next(err);
  }
});

// Create new Input (1)
router.post("/", async (request, response, next) => {
  try {
    let grade = request.body;

    if (!grade.student || !grade.subject || !grade.type) {
      throw new Error(
        "Invalid arguments, the input must have Student, Subject and Type to add new Grade"
      );
    }

    const data = JSON.parse(await readFile("grades.json"));

    grade = {
      id: data.nextId++,
      ...grade,
      timestamp: new Date(),
    };

    data.grades.push(grade);

    await writeFile(global.fileName, JSON.stringify(data, null, 2));

    response.status(200).send(grade);
    logger.info(`POST /account - ${JSON.stringify(grade)}`);
  } catch (err) {
    next(err);
  }
});

// Update values from an id (2)
router.put("/:id", async (request, response, next) => {
  try {
    const grade = request.body;

    if (!grade.id || !grade.student || !grade.subject || !grade.type) {
      throw new Error("Invalid arguments, missing fields");
    }

    const data = JSON.parse(await fs.readFile(global.fileName));
    const index = data.grades.findIndex((grad) => {
      return grad.id === parseInt(grade.id);
    });

    if (index === -1) {
      throw new Error("Error 404: the searched register wasn't found.");
    }

    data.grades[index].student = grade.student;
    data.grades[index].subject = grade.subject;
    data.grades[index].type = grade.type;
    data.grades[index].value = grade.value;

    await writeFile(global.fileName, JSON.stringify(data, null, 2));

    response.status(200).send(grade);
    logger.info(`PUT /grade ${JSON.stringify(grade)}`);
  } catch (err) {
    next(err);
  }
});

// Delete (3)
router.delete("/:id", async (request, response, next) => {
  try {
    const grade = request.body;

    const data = JSON.parse(await fs.readFile(global.fileName));
    const index = data.grades.findIndex((grad) => {
      return grad.id === parseInt(grade.id);
    });

    if (index === -1) {
      throw new Error("Error 404: the searched register wasn't found.");
    }

    data.grades.splice(index, 1);

    await writeFile(global.fileName, JSON.stringify(data, null, 2));

    response
      .status(200)
      .send(`The id ${request.params.id} was removed successfully.`);
    logger.info(`DELETE /grade/:id ${request.params.id}`);
  } catch (err) {
    next(err);
  }
});

router.use((err, request, response, next) => {
  global.logger.error(`${err.message}`);
  response.status(400).send({ error: err.message });
});

export default router;
