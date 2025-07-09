const express = require('express');
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get all evaluations
 */
router.get('/', async (req, res) => {
  try {
    const evaluations = await prisma.evaluations.findMany();

    res.send(evaluations);
  } catch (error) {
    res.status(500).send('There was an error fetching evaluations.');
  }
});

/**
 * Get a evaluation by id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const evaluation = await prisma.evaluations.findUnique({
      where: { id: id }
    })

    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found" });
    }

    res.send(evaluation);
  } catch (error) {
    res.status(500).send('There was an error fetching evaluations.');
  }
});

// /**
//  * Create a evaluation with the data in body
//  */
// router.post('/', async (req, res) => {
//   try {
//     const data = req.body

//     await prisma.evaluations.create({
//       data: {
//         title: data.title,
//         description: data.description,
//         rows: data.rows,
//         columns: data.columns,
//         criteria_column: data.criteria_column,
//         headers: {
//           create: {
//             titles: {
//               create: data.headers.titles.map((header) => {
//                 return {
//                   name: header.name,
//                   description: header.description,
//                   points: header.points,
//                   weight: header.weight,
//                   index: header.index
//                 }
//               })
//             }
//           }
//         },
//         criteria: {
//           create: data.criteria.map((criterion) => {
//             return {
//               name: criterion.name,
//               description: criterion.description,
//               points: criterion.points,
//               weight: criterion.weight,
//               index: criterion.index,
//               levels: {
//                 create: criterion.levels.map((level) => {
//                   return {
//                     name: level.name,
//                     description: level.description,
//                     points: level.points,
//                     weight: level.weight,
//                     index: level.index
//                   }
//                 })
//               }
//             }
//           })
//         }
//       }
//     });

//     res.status(200).send("Evaluation created.");
//   } catch (error) {
//     res.status(500).send('There was an error fetching evaluations.');
//   }
// })

// /**
//  * Update a evaluation by id with the data in body.
//  */
// router.put('/:id', async (req, res) => {
//   try {
//     const id = req.params.id;
//     const data = req.body

//     await prisma.$transaction([
//       await prisma.headers.delete({
//         where: { evaluation_id: id }
//       }),
//       await prisma.criteria.deleteMany({
//         where: { evaluation_id: id }
//       }),
//       await prisma.evaluations.update({
//         where: { id: id },
//         data: {
//           title: data.title,
//           description: data.description,
//           rows: data.rows,
//           columns: data.columns,
//           criteria_column: data.criteria_column,
//           headers: {
//             create: {
//               titles: {
//                 create: data.headers.titles.map((header) => {
//                   return {
//                     name: header.name,
//                     description: header.description,
//                     points: header.points,
//                     weight: header.weight,
//                     index: header.index
//                   }
//                 })
//               }
//             }
//           },
//           criteria: {
//             create: data.criteria.map((criterion) => {
//               return {
//                 name: criterion.name,
//                 description: criterion.description,
//                 points: criterion.points,
//                 weight: criterion.weight,
//                 index: criterion.index,
//                 levels: {
//                   create: criterion.levels.map((level) => {
//                     return {
//                       name: level.name,
//                       description: level.description,
//                       points: level.points,
//                       weight: level.weight,
//                       index: level.index
//                     }
//                   })
//                 }
//               }
//             })
//           }
//         }
//       })
//     ]);

//     res.status(200).send("Evaluation updated.");
//   } catch (error) {
//     res.status(500).send('There was an error fetching evaluations.');
//   }
// })

// /**
//  * Delete a evaluation by id
//  */
// router.delete('/:id', async (req, res) => {
//   try {
//     const id = req.params.id;
//     await prisma.evaluations.delete({
//       where: { id: id }
//     })

//     res.status(200).send("Evaluation deleted");
//   } catch (error) {
//     res.status(500).send('There was an error deleting evaluation.');
//   }
// });

module.exports = router;