module.exports = {
  comet: {
    port: 3000,
    instrument: {
      auth: {
        type: 'basic',
        username: 'pawchat',
        password: '$2y$10$jWQFcGpFl090TmkGH.ajcuXWkzK4WI8ER.5heX4MzZOz98Z9rHCWW', // bcrypt: pawchat
      }
    },
    socketAdapter: 'none',
    redisCluster: [
      {
        host: 'localhost',
        port: 6379,
      },
    ]
  },
  job: {},
  logic: {},
};
