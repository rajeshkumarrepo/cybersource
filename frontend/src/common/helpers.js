import { SERVER_URL } from "../constant"

export const removeElement = elementId => {
  const element = document.getElementById(elementId)
  !!element && element.parentNode.removeChild(element)
}

/**
 * Add Script
 * @param {*} src 
 * @param {*} id 
 * @param {*} async 
 * @param {*} selector 
 */
export const addScript = (src, id, async = true, selector = false) => {
  document.querySelectorAll(`script#${id}`)
    .forEach(e => e.parentNode.removeChild(e))
  const script = document.createElement('script')
  script.src = src
  script.id = id
  script.async = async
  const element = !!selector ? document.getElementById(selector) : false
  !!element ?
    element.parentNode.insertBefore(script, element.nextSibling) :
    document.head.appendChild(script)
}


/**
 * Add script content
 * @param {*} content 
 * @param {*} id 
 * @param {*} selector 
 */
export const addScriptContent = (content, id, selector = false) => {
  document.querySelectorAll(`script#${id}`)
    .forEach(e => e.parentNode.removeChild(e))
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.id = id
  const textNode = document.createTextNode(content)
  script.appendChild(textNode)

  const element = !!selector ? document.getElementById(selector) : false
  !!element ?
    element.parentNode.insertBefore(script, element.nextSibling) :
    document.head.appendChild(script)
}


export const waitForScript = (name, timeout = 3) => {
  return new Promise(resolve => {
    let waited = 0
    function wait(interval) {
      setTimeout(() => {
        waited += interval
        if (window[name] !== undefined)
          return resolve(true)
        else if (waited >= timeout * 1000)
          return resolve(false)
        wait(interval * 2)
      }, interval)
    }
    return wait(500)
  })
}


/**
 * Prepare request
 * @param {*} method 
 * @param {*} url 
 * @param {*} data 
 * @param {*} dataType 
 * @param {*} contentType 
  */
export const prepareRequest = async (method, url, data, dataType, contentType) =>
  new Promise((resolve, reject) => {
    const serverUrl = SERVER_URL + url
    fetch(serverUrl, {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: "include",
      ...(data && { 'body': data }),
      ...(dataType && { 'dataType': dataType }),
      ...(contentType && { 'contentType': contentType })
    })
      .then(res => res.json())
      .then(result => resolve(result))
      .catch(error => reject(error))
  })

