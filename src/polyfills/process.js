// Custom process polyfill for browser environment
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development'
    },
    browser: true,
    version: '',
    versions: {},
    platform: 'browser',
    arch: 'x64',
    title: 'browser',
    pid: 0,
    nextTick: function(cb) {
      setTimeout(cb, 0);
    }
  };
}

module.exports = window.process || {};
