/**
 * # Requirements functions
 * Copyright(c) 2016 Stefano Balietti
 * MIT Licensed
 *
 * Functions to test the requirements of incoming client.
 * ---
 */
module.exports =  {

    /**
     * ### nodeGameBasic
     *
     * Checks whether the basic dependencies of nodeGame are satisfied
     *
     * @param {function} result The asynchronous result function
     *
     * @return {array} Array of synchronous errors
     */
    nodegameBasic: function(result) {
        var errors, db;
        errors = [];

        if ('undefined' === typeof NDDB) {
            errors.push('NDDB not found.');
        }

        if ('undefined' === typeof JSUS) {
            errors.push('JSUS not found.');
        }

        if ('undefined' === typeof node.window) {
            errors.push('node.window not found.');
        }

        if ('undefined' === typeof W) {
            errors.push('W not found.');
        }

        if ('undefined' === typeof node.widgets) {
            errors.push('node.widgets not found.');
        }

        if ('undefined' !== typeof NDDB) {
            try {
                db = new NDDB();
            }
            catch(e) {
                errors.push('An error occurred manipulating the NDDB object: ' +
                            e.message);
            }
        }

        // We need to test node.Stager because it will be used in other tests.
        if ('undefined' === typeof node.Stager) {
            errors.push('node.Stager not found.');
        }

        return { success: !errors.length, errors: errors };
    },

    nodegameSetup: function(result) {
        var stager = new node.Stager();
        var game = {};
        var errors = [];

        game.metadata = {
            name: 'Requirements: nodeGameSetup',
            description: 'Tests node.setup.',
            version: '0.2.0'
        };

        try {
            stager.setOnInit(function() {
                console.log('Init test.');
                return true;
            });

            stager.addStage({
                id: 'requirements',
                cb: function() {
                    return true;
                },
                steprule: node.stepRules.WAIT
            });

            stager.next('requirements');

            // Setting the property in game.

            game.plot = stager.getState();

            // Configuring nodegame.
            node.setup('nodegame', {
                // HOST needs to be specified only
                // if this file is located in another server
                // host: http://myserver.com,
                window: {
                    promptOnleave: false,
                    noEscape: true // Defaults TRUE
                },
                env: {
                    auto: false
                },
                events: {
                    dumpEvents: false, // output to console all fired events
                    history: false // keep a record of all fired events
                },
                socket: {
                    type: 'SocketIo', // for remote connections
                    reconnect: false
                },
                metadata: game.metadata,
                plot: game.plot,
                verbosity: 10
            });
        }
        catch(e) {
            errors.push(e);
        }

        return { success: !errors.length, errors: errors };
    },

    /**
     * ### loadFrameTest
     *
     * Checks whether the iframe can be created and used
     *
     * Requires an active connection.
     *
     * @param {function} result The asynchronous result function
     *
     * @return {array} Array of synchronous errors
     */
    loadFrameTest: function(result) {
        var errors, that, testIframe, root;
        var oldIframe, oldIframeName, oldIframeRoot, iframeName;
        errors = [];
        that = this;
        oldIframe = W.getFrame();

        if (oldIframe) {
            oldIframeName = W.getFrameName();
            oldIframeRoot = W.getFrameRoot();
            root = W.getIFrameAnyChild(oldIframe);
        }
        else {
            root = document.body;
        }

        try {
            iframeName = 'testIFrame';
            testIframe = W.addIFrame(root, iframeName, {
                style: { display: 'none' }
            });
            W.setFrame(testIframe, iframeName, root);
            W.loadFrame('/pages/testpage.htm', function() {
                var found;
                found = W.getElementById('root');
                if (!found) {
                    errors.push('W.loadFrame failed to load a test frame ' +
                                'correctly.');
                }
                root.removeChild(testIframe);
                if (oldIframe) {
                    W.setFrame(oldIframe, oldIframeName, oldIframeRoot);
                }
                else {
                    W.frameElement = null;
                    W.frameWindow = null;
                    W.frameDocument = null;
                    W.frameRoot = null;
                }
                result(!errors.length, errors);
            });
        }
        catch(e) {
            errors.push('W.loadFrame raised an error.');
            return { success: false, errors: errors, data: e };
        }
    },

    speedTest: function(result, params) {
        var ping, pingId, count, LIMIT, totalTime, pingMore;
        var timeout, maxPingTime, errors, pingDone;

        count = 1;
        errors = [];
        pingMore = true;
        LIMIT = params.messages;
        pingId = 'ping_speedtest';
        maxPingTime = params.time;

        ping = function() {
            node.get('PING', function(msg) {
                ++count;
                if (pingMore) {
                    if (count >= LIMIT) pingMore = false;
                    ping();
                }
                else if (pingDone) {
                    node.warn('Requirement speedTest: received more pongs ' +
                              'than expected: ' + count);
                }
                else {
                    totalTime = node.timer.getTimeSince(pingId);
                    clearTimeout(timeout);
                    console.log('-----> Total time: ' + totalTime);
                    if (totalTime > maxPingTime) {
                        errors.push('Your connection is too slow');
                    }
                    result(!errors.length, errors);
                    pingDone = true;
                }
            });
        };

        // Start counting time.
        node.timer.setTimestamp(pingId);
        // start pinging.
        ping();
        // Stop pinging if it takes too long.
        timeout = setTimeout(function() {
            pingMore = false;
        }, (maxPingTime + 100));
    },

    viewportSize: function(result, params) {
        var res, p, minErr, maxErr;
        if (!JSUS || !JSUS.viewportSize) {
            return {
                success: false,
                errors: 'Could not execute viewport size test.'
            };
        }
        p = params;
        if ('object' !== typeof p ||
            ('number' !== typeof p.minX && 'number' !== typeof p.minY &&
             'number' !== typeof p.maxX && 'number' !== typeof p.minY)
           ) {

            return {
                success: false,
                errors: 'Missing or invalid parameters for viewport size test.'
            };
        }
        // Get viewport.
        res = JSUS.viewportSize();

        if ('number' === typeof p.minX && p.minX > res.x ||
            'number' === typeof p.minY && p.minY > res.y) {

            return {
                success: false,
                errors: [
                    'Your resolution is too low. Found: ' +
                        res.x + 'x' + res.y + '. Required: ' +
                        (p.minX || '(Any)') + 'x' + (p.minY || '(Any)') +
                        ". If you can, maximize your browser and retry."
                ]
            };
        }
        else if ('number' === typeof p.maxX && p.maxX < res.x ||
            'number' === typeof p.maxY && p.maxY < res.y) {

            return {
                success: false,
                errors: [
                    'Your resolution is too high. Found: ' +
                        res.x + 'x' + res.y + '. Required: ' +
                        (p.maxX || '(Any)') + 'x' + (p.maxY || '(Any)') +
                        ". If you can, resize your browser's window and retry."
                ]
            };
        }

        return { success: true };
    },

    browserDetect: function(result, params) {
        return { success: true };
    },

    cookieSupport: function(result, params) {
        var res, errors;
        if (!JSUS || !JSUS.cookieSupport) {
            return {
                success: false,
                errors: ['Could not execute cookie-support test.']
            };
        }
        errors = [];
        res = JSUS.cookieSupport();
        if (params === 'persistent' && res !== true) {
            errors = [ 'No persistent cookie support found' ];
        }
        else if (params === 'session' && 'boolean' !== typeof res) {
            errors = [ 'No cookie support found' ];
        }
        return  { success: !errors.length, errors: errors };
    },

    testFail: function(result, params) {
        var errors;
        errors = ['Unknown error.'];
        setTimeout( function() { result(false, errors); }, 1000);
    },

    testSuccess: function(result, params) {
        setTimeout( function() { result(true); }, 1000);
    }
};
