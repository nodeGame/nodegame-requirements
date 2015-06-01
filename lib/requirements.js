/**
 * # Requirements functions
 * Copyright(c) 2015 Stefano Balietti
 * MIT Licensed
 *
 * Sets requiremetns for accessing the Burdenshare channels.
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

        return errors;
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
                style: { display: 'none' } } );
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
                result(errors);
            });
        }
        catch(e) {
            errors.push('W.loadFrame raised an error: ' + extractErrorMsg(e));
            return errors;
        }
    },

    speedTest: function(result) {
    
    },

    browserDetect: function(result) {
    },

    cookieSupport: function(result) {
    }

};