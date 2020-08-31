const RENDER_TO_DOM = Symbol('render to dom')
export class Component {
    constructor() {
        this.props = Object.create(null);
        this.children = [];
    }
    setAttribute(name, value) {
        this.props[name] = value;
    }
    appendChild(component) {
        this.children.push(component);
    }
    get vdom() {
        return this.render().vdom
    }
    [RENDER_TO_DOM](range) {
        this._range = range
        this._vdom = this.vdom
        this._vdom[RENDER_TO_DOM](range)
    }
    update(){
        let isSameNode=(oldNode,newNode)=>{
            
            if(oldNode.type !== newNode.type)
                return false
            for (const key in newNode.props) {
                if(newNode.props[key]!== oldNode.props[key]){
                    return false
                }
            }
            if(Object.keys(oldNode).length > Object.keys(newNode).length){
                return false
            }
            if(newNode.type === '#text'){
                if(newNode.content !== oldNode.content){
                    return false
                }
            }
            return true

        }
        let update = (oldNode,newNode)=>{
            if(!isSameNode(oldNode,newNode)){
                newNode[RENDER_TO_DOM](oldNode._range)
                return
            }
            newNode._range = oldNode._range
            let newChildren = newNode.vchildren
            let oldChildren = oldNode.vchildren

            for (let i = 0; i < newChildren.length; i++) {
                let newChild = newChildren[i]
                let oldChild = oldChildren[i]
                let tailRange = oldChildren[oldChildren.length-1]._range
                if(i < oldChildren.length){
                    update(oldChild,newChild)
                }else {
                    const range = document.createRange()
                    range.setStart(tailRange.endContainer,tailRange.endOffset)
                    range.setEnd(tailRange.endContainer, tailRange.endOffset)
                    newChild[RENDER_TO_DOM](range)
                    tailRange = range
                }
                
            }
        }
        const vdom = this.vdom
        update(this._vdom,vdom)
        this._vdom = vdom

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
        this.update()
    }
}
class ElementWrapper extends Component {
    constructor(type) {
        super(type)
        this.type = type
    }
    get vdom() {
        this.vchildren = this.children.map(child=>child.vdom)
        return this

    }
    [RENDER_TO_DOM](range) {
        this._range = range
        const root = document.createElement(this.type);

        for (const name in this.props) {
            const value = this.props[name]
            if (name.match(/^on([\s\S]+)$/)) {
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
            } else {
                if (name === 'className') {
                    root.setAttribute('class', value);
                }
                root.setAttribute(name, value);
            }
        }
        if(!this.vchildren){
            this.vchildren = this.children.map(child=>child.vdom)
        }
        for (const child of this.vchildren) {
            let childRange = document.createRange()
            childRange.setStart(root, root.childNodes.length)
            childRange.setEnd(root, root.childNodes.length)
            child[RENDER_TO_DOM](childRange)
        }

        replaceContent(range,root)
        
    }
}

class TextWrapper extends Component {
    constructor(content) {
        super(content)
        this.content = content
        this.type = '#text'
    }
    [RENDER_TO_DOM](range) {
        this._range = range
        const root = document.createTextNode(this.content);
        replaceContent(range,root)

    }
    get vdom() {
        return this
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
    let insertChildren = (children) => {
        for (let child of children) {
            if (typeof child === 'string') {
                child = new TextWrapper(child);
            }
            if (child === null) {
                continue
            }
            if (typeof child === 'object' && (child instanceof Array)) {
                insertChildren(child);
            } else {
                e.appendChild(child);
            }
        }
    }
    insertChildren(children);
    return e;
}
function replaceContent(range, node) {
    range.insertNode(node);
    range.setStartAfter(node);
    range.deleteContents();

    range.setStartBefore(node);
    range.setEndAfter(node);
}
export function render(component, parentElement) {
    let range = document.createRange()
    range.setStart(parentElement, 0)
    range.setEnd(parentElement, parentElement.childNodes.length)
    range.deleteContents()
    component[RENDER_TO_DOM](range)
}

