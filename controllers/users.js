const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AuthorizationError = require('../errors/AuthorizationError');
const ConflictError = require('../errors/ConflictError');
// const ForbiddenError = require('../errors/ForbiddenError');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');

const getUsers = (req, res, next) => {
  User.find({})
    .then((users) => {
      if (users) {
        res.status(200).send(users);
      } else {
        next(new AuthorizationError('Пользователи не найдены'));
      }
    })
    .catch(next);
};

const getUserId = (req, res, next) => {
  User.findById(req.params.userId)
    .then((userId) => {
      if (!userId) {
        next(new NotFoundError('Пользователь с данным id не найден'));
      }
      return res.status(200).send(userId);
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequestError('Некорректный _id пользователя'));
      } else {
        next(err);
      }
    });
};

const createUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;
  bcrypt.hash(password, 10)
    .then((hash) => {
      User.create({
        email, password: hash, name, about, avatar,
      });
    })
    .then((user) => {
      res.status(200).send({
        user: {
          email: user.email,
          name: user.name,
          about: user.about,
          avatar: user.avatar,
        },
      });
    })
    .catch((err) => {
      if (err.code === 11000) {
        next(new ConflictError('Пользователь с таким EMAIL уже зарегистрирован'));
      } else if (err.name === 'CastError') {
        next(new BadRequestError('Переданны некорректные данные'));
      } else {
        next(console.log(err));
      }
    });
};

const updateProfile = (req, res, next) => {
  const { name, about } = req.body;
  User.findByIdAndUpdate(req.user._id, { name, about }, { runValidators: true })
    .then((user) => {
      if (!user) {
        next(new NotFoundError('Пользователь с данным id не найден'));
      }
      res.status(200).send({ _id: user._id, name, about });
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Переданы некорректные данные профиля'));
      } else {
        next(err);
      }
    });
};

const updateAvatar = (req, res, next) => {
  const { avatar } = req.body;
  User.findByIdAndUpdate(req.user._id, { avatar }, { runValidators: true })
    .then((user) => {
      if (!user) {
        next(new NotFoundError('Пользователь с данным id не найден'));
      }
      res.status(200).send({ _id: user._id, avatar });
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        throw new BadRequestError('Переданы некорректные данные');
      } else {
        next(err);
      }
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, 'some-secret-key', { expiresIn: '7d' });

      // вернём токен
      res.status(200).send({ token });
    })
    .catch(next);
};

const getMe = (req, res, next) => {
  // const { _id } = req.user;
  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        next(new NotFoundError('Пользователь с данным id не найден'));
      }
      return res.status(200).send(user);
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        throw new BadRequestError('Переданы некорректные данные');
      } else {
        next(err);
      }
    });
};

module.exports = {
  getUsers,
  getUserId,
  createUser,
  updateProfile,
  updateAvatar,
  login,
  getMe,
};
