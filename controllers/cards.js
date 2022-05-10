const Card = require('../models/card');
const ForbiddenError = require('../errors/ForbiddenError');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');

const getCards = (req, res) => {
  Card.find({})
    .then((cards) => res.status(200).send(cards))
    .catch(() => res.status(500).send({ message: 'Произошла ошибка при получении карточек' }));
};

const createCard = (req, res, next) => {
  const { name, link } = req.body;
  const owner = req.user._id;
  Card.create({ name, link, owner })
    .then((card) => res.status(200).send(card))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Переданы некорректные данные карточки'));
      } else {
        next(err);
      }
    });
};

// const deleteCard = (req, res, next) => {
//   Card.findByIdAndRemove(req.params.cardId)
//     .then((card) => {
//       if (!card) {
//         next(new NotFoundError('Карточка с указанным _id не найдена'));
//       } else if (card.owner._id.toString() !== req.user._id.toString()) {
//         next(new ForbiddenError('Нельзя удалить чужую карточку'));
//       }
//       res.status(200).send(card);
//     })
//     .catch((err) => {
//       if (err.name === 'CastError') {
//         next(new BadRequestError('Переданы некорректные данные карточки'));
//       } else {
//         next(err);
//       }
//     });
// };

const deleteCard = (req, res, next) => {
  Card.findById(req.params.cardId)
    .orFail()
    .catch(() => new NotFoundError('Карточка с указанным _id не найдена'))
    .then((card) => {
      if (card.owner._id.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('Нельзя удалить чужую карточку');
      }
      Card.findByIdAndRemove(req.params.cardId)
        .then((cardData) => {
          res.status(200).send({ data: cardData });
        })
        .catch(next);
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequestError('Переданы некорректные данные карточки'));
      } else {
        next(err);
      }
    });
};

// const deleteCard = (req, res, next) => {
//   Card.findById(req.params._id)
//     .orFail()
//     .catch(() => new NotFoundError('Карточка с указанным _id нет.'))
//     .then((card) => {
//       if (card.owner.toString() !== req.user._id) {
//         throw new ForbiddenError('Эта не Ваша карточка');
//       }
//       Card.findByIdAndDelete(req.params._id)
//         .then((cardData) => {
//           res.send({ data: cardData });
//         })
//         .catch(next);
//     })
//     .catch(next);
// };

const likeCard = (req, res, next) => {
  Card.findByIdAndUpdate(req.params.cardId, { $addToSet: { likes: req.user._id } }, { new: true })
    .then((card) => {
      if (!card) {
        next(new NotFoundError('Передан несуществующий id карточки'));
      }
      return res.status(200).send(card);
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequestError('Переданы некорректные данные карточки'));
      } else {
        next(err);
      }
    });
};

const dislikeCard = (req, res, next) => {
  Card.findByIdAndUpdate(req.params.cardId, { $pull: { likes: req.user._id } }, { new: true })
    .then((card) => {
      if (!card) {
        next(new NotFoundError('Передан несуществующий id карточки'));
      }
      return res.status(200).send({ data: card });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequestError('Переданы некорректные данные карточки'));
      } else {
        next(err);
      }
    });
};

module.exports = {
  getCards,
  createCard,
  deleteCard,
  likeCard,
  dislikeCard,
};
