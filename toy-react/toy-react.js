const RENDER_TO_DOM = Symbol('render to dom')
class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type);
    }
    setAttribute(name, value) {
        if (name.match(/^on([\s\S]+)$/)) {
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
        }else {
            if(name === 'className'){
                this.root.setAttribute('class', value);
            }
            this.root.setAttribute(name, value);
        }
        
    }
    appendChild(component) {
        let range = document.createRange()
        range.setStart(this.root, this.root.childNodes.length)
        range.setEnd(this.root, this.root.childNodes.length)
        range.deleteContents()
        component[RENDER_TO_DOM](range)
    }
    [RENDER_TO_DOM](range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
    }
    [RENDER_TO_DOM](range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
}

export function createElement(type, attributes, ...children) {
    let e;
    if (typeof type === 'string') {
        e = new ElementWrapper(type);
    } else {
        e = new type
    }
    for (let name in attributes) {
        e.setAttribute(name, attributes[name]);
    }
    let insetChildren = (children) => {
        for (let child of children) {
            if (typeof child === 'string') {
                child = new TextWrapper(child);
            }
            if( child === null) {
                continue
            }
            if (typeof child === 'object' && (child instanceof Array)) {
                insetChildren(child);
            } else {
                e.appendChild(child);
            }
        }
    }
    insetChildren(children);
    return e;
}

export function render(component, parentElement) {
    let range = document.createRange()
    range.setStart(parentElement, 0)
    range.setEnd(parentElement, parentElement.childNodes.length)
    range.deleteContents()
    component[RENDER_TO_DOM](range)
}

export class Component {
    constructor() {
        this.props = Object.create(null);
        this.children = [];
        this._root = null;
        this._range = null
    }
    setAttribute(name, value) {
        this.props[name] = value;
    }
    appendChild(component) {
        this.children.push(component);
    }
    [RENDER_TO_DOM](range) {
        this._range = range
        this.render()[RENDER_TO_DOM](range)
    }
    rerender() {
        this._range.deleteContents()
        this[RENDER_TO_DOM](this._range)
    }
    setState(newState) {
        if (this.state === null || typeof this.state !== 'object') {
            this.state = newState
            this.rerender()
            return
        }
        const merge = (oldState, newState) => {
            
            for (const key in newState) {
                if (oldState[key] !== null || typeof oldState[key] !== 'object') {
                    oldState[key] = newState[key]
                } else {
                    merge(oldState[key], newState[key])
                }
            }

        }
        merge(this.state, newState)
        this.rerender()
    }
}