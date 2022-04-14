/**
 * @param {any} error
 * @param {function(any):void} logger
 */
export function showMessage(error, logger = console.log) {
    logger(error);
    alert(error);
}

/**
 * @param {any} error
 */
export function showError(error) {
    showMessage(error, console.error);
}

/**
 * @param {HTMLElement} element
 * @param {function(HTMLElement):Promise<any>} callback
 * @returns {Promise<any>}
 */
export async function disableElementWhileCallback(element, callback) {
    element.disabled = true;
    try {
        return await callback(element);
    } finally {
        element.disabled = false;
    }
}

/**
 * @param {int} ms
 * @returns {Promise<void>}
 */
export async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
