var spawn = require('child_process').spawn;

module.exports = function (pid, signal) {
    var tree = {};
    tree[pid] = [];
    var pidsToProcess = {};
    pidsToProcess[pid] = 1;
    buildProcessTree(pid, tree, pidsToProcess, function () {
        killAll(tree, signal);
    });
}

function killAll (tree, signal) {
    var killed = {};
    Object.keys(tree).forEach(function (pid) {
        tree[pid].forEach(function (pidpid) {
            if (!killed[pidpid]) {
                process.kill(pidpid, signal);
                killed[pidpid] = 1;
            }
        });
        if (!killed[pid]) {
            process.kill(pid, signal);
            killed[pid] = 1;
        }
    });
}

function buildProcessTree (parentPid, tree, pidsToProcess, cb) {
    var ps = spawn('ps', ['-o', 'pid', '--no-headers', '--ppid', parentPid]);
    var allData = '';
    ps.stdout.on('data', function (data) {
        var data = data.toString('ascii');
        allData += data;
    });
    ps.on('exit', function (code) {
        delete pidsToProcess[parentPid];

        if (code != 0) {
            // no more parent processes
            if (Object.keys(pidsToProcess).length == 0) {
                cb();
            }
            return
        }

        pids = [];
        pid = '';
        for (i = 0; i < allData.length; i++) {
            if (allData[i] == '\n') {
                pids.push(parseInt(pid, 10));
                pid = '';
                continue;
            }
            if (allData[i] != ' ') {
                pid += allData[i];
            }
        }

        pids.forEach(function (pid) {
            tree[parentPid].push(pid)
            tree[pid] = [];
            pidsToProcess[pid] = 1;
            buildProcessTree(pid, tree, pidsToProcess, cb);
        });
    });
}

