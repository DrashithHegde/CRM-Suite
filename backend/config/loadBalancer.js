const cluster = require('cluster');
const os = require('os');

class LoadBalancer {
  constructor() {
    this.numWorkers = process.env.CLUSTER_WORKERS || os.cpus().length;
    this.workers = [];
  }

  setupCluster(app, serverCallback) {
    if (cluster.isMaster) {
      console.log(`🚀 Master ${process.pid} is running`);
      console.log(`📊 Spawning ${this.numWorkers} worker processes...`);

      for (let i = 0; i < this.numWorkers; i++) {
        const worker = cluster.fork();
        this.workers.push(worker);

        worker.on('message', (msg) => {
          if (msg.type === 'health') {
            console.log(`Worker ${worker.process.pid} is healthy`);
          }
        });
      }

      cluster.on('exit', (worker, _code, _signal) => {
        console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
        const newWorker = cluster.fork();
        this.workers = this.workers.filter((w) => w !== worker);
        this.workers.push(newWorker);
      });

      let currentWorker = 0;
      const loadBalancerMiddleware = (req, res, next) => {
        const _worker = this.workers[currentWorker];
        currentWorker = (currentWorker + 1) % this.workers.length;
        next();
      };

      return loadBalancerMiddleware;
    } else {
      serverCallback();
    }
  }

  getHealthStatus() {
    return {
      masterPID: cluster.isMaster ? process.pid : null,
      workerCount: this.workers.length,
      workers: this.workers.map((w) => ({
        pid: w.process.pid,
        isDead: w.isDead(),
        isConnected: w.isConnected(),
      })),
    };
  }
}

module.exports = new LoadBalancer();
