import { createElement, render, Component } from './toy-react';

class MyComponent extends Component {
    render() {
        return (
            <div>
                <h1>my</h1>
                {this.children}
            </div>
        );
    }
}




render(<MyComponent id="a" class="b">
    <div></div>
    <div style="color: red">123</div>
</MyComponent>, document.body);