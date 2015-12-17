/* Copyright (c) 2012 Mircea Alexandru */

var _ = require('lodash');
var uuid = require('uuid');
var cronJob = require('cron').CronJob;


/**
 * Cron Seneca Plugin
 *
 * @module senecaCron
 * @param {Object} options - Plugin options (none so far)
 *
 * @returns {string} the plugin name, google-auth
 */
module.exports = function (options) {
  var seneca = this;
  var name = 'cron';
  var cronJobs = {};

  /**
   * @callback cronActionCallback
   * @param {Object} error - error that occured
   * @param {Object} result - result of call
   * @param {uuid} result.id - id of job
   * @param {string} result.status - new status of job
   */

  /**
   * Job adding action
   *
   * @param {Object} msg - Message option
   * @param {String} msg.time - Time
   * @param {String} msg.timezone - Timezone
   * @param {Function} msg.act - Action to be run
   * @param {Function} msg.after - After action
   *
   * @param {cronActionCallback} respond - callback
   *
   * @todo Check time/timezone string!
   */
  function addJob(msg, respond) {
    var cron_time = msg.time;
    var action = msg.act;
    var after = msg.after;
    var timezone = msg.timezone;

    seneca.log.debug('setting cron for', msg, action, after);

    var job = new cronJob(cron_time, action, after, true, timezone);
    var id = uuid();
    cronJobs[id] = job;

    respond(null, {id: id, status: 'added'})
  }


  /**
   * Job stopping action
   *
   * @param {Object} msg - Message option
   * @param {Function} msg.id - Id of the job to stop
   *
   * @param {cronActionCallback} respond - callback
   */
  function stopJob(msg, respond) {
    var id = msg.id;

    seneca.log.debug('stop cron job', id);
    if (_.isUndefined(cronJobs[id])) {
      seneca.log.debug('cannot stop job, job not found', id);
      respond(new Error('invalid cron job ' + id))
    }
    else {
      var job = cronJobs[id];
      job.stop();
      respond(null, {id: id, status: 'stopped'})
    }
  }

  /**
   * Job starting action
   *
   * @param {Object} msg - Message option
   * @param {Function} msg.id - Id of the job to start
   *
   * @param {cronActionCallback} respond - callback
   */
  function startJob(msg, respond) {
    var id = msg.id;

    seneca.log.debug('start cron job', id);
    if (_.isUndefined(cronJobs[id])) {
      seneca.log.debug('cannot start job, job not found', id);

      respond(new Error('invalid cron job ' + id)); // here I must report error
    }
    else {
      var job = cronJobs[id];
      job.start();
      respond(null, {id: id, status: 'started'})
    }
  }

  /**
   * Job closing action
   *
   * @param {Object} msg - Message option
   * @param {Function} msg.id - Id of the job to close
   *
   * @param {cronActionCallback} respond - callback
   */
  function closeJob(msg, respond) {
    var id = msg.id;

    seneca.log.debug('close cron job', id);
    if (_.isUndefined(cronJobs[id])) {
      seneca.log.debug('cannot close job, job not found', id);
      respond(new Error('invalid cron job ' + id)); // here I must report error
    }
    else {
      var job = cronJobs[id];
      delete cronJobs[id];
      job.stop();
      respond(null, {id: id, status: 'closed'})
    }
  }

  /**
   * Clean up plugin. Close all jobs
   *
   * @param {Object} msg - Message option
   *
   * @param {cronActionCallback} respond - callback
   */
  function close(msg, respond) {
    seneca.log.debug('close cron jobs');
    for (var id in cronJobs) {
      var job = cronJobs[id];
      seneca.log.debug('close cron job', id);
      job.stop();
    }
    respond()
  }

  seneca
    .add({role: name, cmd: 'addjob'}, addJob)
    .add({role: name, cmd: 'stopjob'}, stopJob)
    .add({role: name, cmd: 'startjob'}, startJob)
    .add({role: name, cmd: 'closejob'}, closeJob)
    // FIXME: close all??? ou extension?
    .add({role: name, cmd: 'close'}, close);

  return name;

};
