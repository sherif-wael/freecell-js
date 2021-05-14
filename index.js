const RANKS_RECORD = {
    A: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13
};

const SUITS = ["club", "diamond", "heart", "spade"];

const SUITS_COLOR = {
    heart: "red",
    diamond: "red",
    spade: "black",
    club: "black"
}

// Factory

const factory = {
    createEmptyPile(playground){
        return new Pile([], playground);
    },
    createEmptyStore(playground){
        return new Store([], playground);
    },
    createEmptyFoundation(playground){
        return new Foundation([], playground);
    },
    createEmptyDeck(playground){
        return new Deck([], playground);
    },
    createFullDeck(playground){
        const deck = new Deck([], playground);
        deck.fillDeck();
        return deck;
    },
    createPlayground(){
        const playground = new Playground();
        playground.init();
        playground.deck.fillDeck();
        playground.createDOM();
        return playground;
    }
}



// Playground components 

class Card{
    constructor(rank, suit, color, wrapper){
        this.rank = rank;
        this.suit = suit;
        this.color = color;
        this.wrapper = wrapper;
        this.dom = new CardElement(0, 0, rank, suit);
        document.body.appendChild(this.dom.element);
        this.dom.element.onmousedown = e => this.handleMouseDown(e);
    }

    hasSameColor(card){
        return this.color === card.color;
    }

    hasSameSuit(card){
        return this.suit === card.suit;
    }

    getRankDiff(card){
        return RANKS_RECORD[this.rank] - RANKS_RECORD[card.rank];
    }

    isHigherByOne(card){
        return this.getRankDiff(card) === 1;
    }
    
    addWrapper(wrapper){
        this.wrapper = wrapper;
    }

    transferToWrapper(ms){
        let {top, left} = this.wrapper.dom.getCurrentPos();
        let GAP = 30;

        if(this.wrapper.type === "pile"){
            top += (GAP * (this.wrapper.size - 1));
        }

        this.dom.setNewPos(top, left, ms);
    }

    move(dx, dy, ms){
        this.dom.move(dx, dy, ms);
    }

    handleMouseDown(e){
        e.preventDefault();

        const playground = this.wrapper.playground;

        if(!playground.hasSelectedCards()){
            this.wrapper.selectCards(this);
        }else{
            playground.transferCards(this.wrapper);
            playground.unselect(); 
        }

        const handleMove = moveEvent => {
            if(moveEvent.buttons === 0){
                document.removeEventListener("mousemove", handleMove);
                // playground.attachCardsToNearest();
                return;
            }
            e.preventDefault();
            const dx = moveEvent.clientX - e.clientX;
            const dy = moveEvent.clientY - e.clientY;
            playground.moveCards(dx, dy);
        }

        document.addEventListener("mousemove", handleMove);

        e.currentTarget.ondrag = () => false;
    } 

}


class Pile{
    type = "pile";
    constructor(cards, playground){
        this.cards = cards;
        this.playground = playground;
        this.dom = new PileElement();
    }

    get size(){
        return this.cards.length;
    }

    addWrapperToCards(){
        this.cards.forEach(card => card.addWrapper(this));
    }

    selectCards(card){
        let cardIndex = this.cards.findIndex(c => c === card);
        let arr = this.cards.slice(cardIndex);

        if(this.isValidSeq(arr) && arr.length <= this.playground.allowedCardsToMove()){
            this.playground.select(arr);
        }
    }

    isValidSeq(cards){
        let currentCard = cards[0];

        for(let i = 1; i < cards.length; i++){
            if(currentCard.isHigherByOne(cards[i]) && !cards[i].hasSameColor(currentCard)){
                currentCard = cards[i];
            }else{
                return false;
            }
        }
        return true;
    }

    addCard(card){
        if(this.isEmpty()){
            this.cards.push(card);
            card.addWrapper(this);
            card.dom.setZIndex(this.cards.length);
            return;
        }
        
        const lastCard = this.cards[this.cards.length - 1];

        if(this.isValidSeq([lastCard, card])){
            this.cards.push(card);
            card.addWrapper(this);
            card.dom.setZIndex(this.cards.length);
        }
    }

    removeCard(card){
        this.cards = this.cards.filter(c => c !== card);
    }

    isEmpty(){
        return this.cards.length === 0;
    }

    pushCard(card){
        this.cards.push(card);
        card.dom.setZIndex(this.cards.length);
        card.addWrapper(this);
    }
}


class Foundation{
    type = "foundation";
    constructor(cards, playground){
        this.cards = cards;
        this.playground = playground;
        this.dom = new FoundationElement();
    }

    get size(){
        return this.cards.length;
    }

    isValidSeq(cards){
        const currentCard = cards[0];

        for(let i = 1; i < cards.length; i++){
            if(cards[i].isHigherByOne(currentCard) && cards[i].hasSameColor(currentCard)){
                currentCard = cards[i];
            }else{
                return false;
            }
        }
        return true;
    }

    selectCards(card){
        if(this.playground.allowedCardsToMove() >= 1){
            this.playground.select([card]);
        }
    }

    addCard(card){
        if(this.isEmpty()){
            this.cards.push(card);
            card.addWrapper(this);
            card.dom.setZIndex(this.cards.length);
            return;
        }

        const lastCard = this.cards[this.cards.length - 1];
        const arr = [lastCard, card];

        if(this.isValidSeq(arr)){
            this.cards.push(card);
            card.addWrapper(this);
            card.dom.setZIndex(this.cards.length);
        }
    }

    removeCard(card){
        console.log(card);
        this.cards = this.cards.filter(c => c !== card);
    }

    isEmpty(){
        return this.cards.length === 0;
    }
}



class Store{
    type = "store";
    constructor(cards, playground){
        this.cards = cards;
        this.playground = playground;
        this.dom = new StoreElement();
    }

    get size(){
        return this.cards.length;
    }

    selectCards(card){
        this.playground.select([card]);
    }

    addCard(card){
        if(this.isEmpty()){
            this.cards.push(card);
            card.addWrapper(this)
            card.dom.setZIndex(this.cards.length);
        }
    }

    removeCard(card){
        this.cards = this.cards.filter(c => c !== card);
    }

    isEmpty(){
        return this.cards.length === 0;
    }

    isValidSeq(cards){
        if(cards.lengtht === 1 && this.isEmpty()) return true;
        return false;
    }
}


class Deck{
    type = "deck";
    constructor(cards, playground){
        this.cards = cards;
        this.playground = playground;
        this.dom = new DeckElement();
    }

    addCard(card){
        this.cards.push(card);
        card.addWrapper(this);
    }

    removeCard(card){
        this.cards = this.cards.filter(c => c !== card);
    }

    fillDeck(){
        const cards = [];

        for(let suit of SUITS){
            for(let rank of Object.keys(RANKS_RECORD)){
                const card = new Card(rank, suit, SUITS_COLOR[suit]);
                card.addWrapper(this);
                card.transferToWrapper(0);
                cards.push(card);
            }
        }
        this.cards = cards;
    }

    hideDeck(){
        this.dom.hideDeck();
    }

    displayDeck(){
        this.dom.displayDeck();
    }
}


class Playground{
    constructor(piles, foundations, stores, selected){
        this.piles = piles;
        this.foundations = foundations;
        this.stores = stores;
        this.selectedCards = selected;
    }

    init(){
        const piles = [...new Array(8)].map(() => factory.createEmptyPile(this));
        const foundations = [...new Array(4)].map(() => factory.createEmptyFoundation(this));
        const stores = [...new Array(4)].map(() => factory.createEmptyStore(this));
        const deck = factory.createEmptyDeck(this);
        const selectedCards = [];

        this.piles = piles;
        this.foundations = foundations;
        this.stores = stores;
        this.deck = deck;
        this.selectedCards = selectedCards;
    }

    hasSelectedCards(){
        return this.selectedCards.length > 0;
    }

    getSelectedCards(){
        return this.selectCards;
    }

    select(cards){
        this.selectedCards = cards;
        this.selectedCards.forEach(c => {
            c.dom.select();
        })
    }

    unselect(){
        this.selectedCards.forEach(c => c.dom.unselect());
        this.selectedCards = [];
    }

    transferCards(to){
        if(this.selectedCards.length > this.allowedCardsToMove(to)) return;
        this.selectedCards.forEach(c => {
            if(to !== c.wrapper){
                c.wrapper.removeCard(c)
            }
        });
        this.selectedCards.forEach((c, i) => {
            to.addCard(c);
            c.transferToWrapper(i * 30);
        });
    }
    
    moveCards(dx, dy){
        this.selectedCards.forEach((c, i) => c.move(dx, dy, i * 30));
    }
    
    attachCardsToNearest(){
        if(!this.hasSelectedCards()) return; 
        const firstCard = this.selectedCards[0];
        const pos = firstCard.dom.getCurrentPos();
        const a1 = {x: pos.x, y: pos.y}, a2 = {x: pos.x + pos.width, y: pos.y + pos.height};
        const allComponents = [...this.piles, ...this.stores, ...this.foundations];

        for(let c of allComponents){
            const cPos = c.dom.getCurrentPos();
            const b1 = {x: cPos.x, y: cPos.y}, b2 = {x: cPos.x + cPos.width, y: cPos.y + cPos.height};

            if(doOverlap(a1, a2, b1, b2) && c.isValidSeq(this.selectedCards)){
                this.transferCards(c);
                this.unselect();
                return;
            }
        }

        this.transferCards(firstCard.wrapper);
    }

    createDOM(){
        this.dom = new PlaygroundElement(this);
    }

    distributeCards(){
        let deck = this.deck;
        let used = {};

        for(let i = 0; i < deck.cards.length; i++){
            let pile = this.piles[i % this.piles.length];
            let cardIndex = Math.floor(Math.random() * deck.cards.length);

            while(used[cardIndex]){
                cardIndex = Math.floor(Math.random() * deck.cards.length);
            }

            used[cardIndex] = true;
            let card = deck.cards[cardIndex];

            pile.pushCard(card);
            card.transferToWrapper(i * 20, i);
        }

        this.deck.cards = [];
    }

    allowedCardsToMove(to){
        let emptyStores = this.stores.reduce((acc, s) => s.isEmpty() ? acc + 1 : acc, 0);
        let emptyPiles = this.piles.reduce((acc, p) => p.isEmpty() ? acc + 1 : acc, 0);

        emptyPiles = !to ? emptyPiles : to.isEmpty() ? emptyPiles - 1 : emptyPiles;

        return (emptyStores + 1) * (emptyPiles + 1);
    }
}



// DOM Elements

function elt(elem, props, ...children){
    const dom = document.createElement(elem);

    if(props) Object.assign(dom, props);

    for(let child of children){
        if(typeof child !== "string") dom.appendChild(child);
        else dom.appendChild(document.createTextNode(child));
    }

    return dom;
}


class CardElement{
    constructor(left, top, rank, suit){
        this.left = left;
        this.top = top;
        const id = this.createId(rank, suit);
        this.element = elt("img", {className: "card", src: `/cards/${id}.png`, id});
    }

    createId(rank, suit){
        const r = `${rank}`;
        const s = suit[0].toUpperCase();
        return `${r}${s}`;
    }
    
    addEvent(event, callback){
        this.element.addEventListener(event, callback);
    }

    move(dx, dy, ms){
        this.setTransition(ms);
        this.element.style.top = `${this.top + dy}px`;
        this.element.style.left = `${this.left + dx}px`;        
    }

    setTransition(ms){
        const time = 100 + ms;
        this.element.style.transition = `left ${time}ms linear, top ${time}ms linear`;
    }

    removeTransition(){
        this.element.style.transition = "";
    }

    setNewPos(top, left, ms){
        this.setTransition(ms);
        this.top = top;
        this.left = left;
        this.element.style.top = `${this.top}px`;
        this.element.style.left = `${this.left}px`;        
    }

    select(){
        this.element.classList.add("selected");
    }

    unselect(){
        this.element.classList.remove("selected");
    }

    getCurrentPos(){
        return this.element.getBoundingClientRect();
    }

    setZIndex(zIndex){
        this.element.style.zIndex = zIndex
    }
}


class PlaygroundElements{
    addEvent(event, callback){
        this.element.addEventListener(event, callback);
    }

    getCurrentPos(){
        return this.element.getBoundingClientRect();
    }
}

class PileElement extends PlaygroundElements{
    constructor(){
        super();
        this.element = elt("div", {className: "pile-column"}, 
                            elt("div", {className: "pile"})
                        );
    }
}

class FoundationElement extends PlaygroundElements{
    constructor(){
        super();
        this.element = elt("div", {className: "foundation"});
    }
}

class StoreElement extends PlaygroundElements{
    constructor(){
        super();
        this.element = elt("div", {className: "store"});
    }
}

class DeckElement extends PlaygroundElements{
    constructor(){
        super();
        this.element = elt("div", {className: "deck"});
        document.body.appendChild(this.element);
    }

    hideDeck(){
        this.element.classList.add("hidden");
    }

    displayDeck(){
        this.element.classList.remove("hidden");
    }
}


class PlaygroundElement{
    constructor(playground){
        const storesWrapper = elt("div", {className: "store-wrapper"},
                                    ...playground.stores.map(s => s.dom.element));
        const pilesWrapper = elt("div", {className: "pile-wrapper"}, 
                                    ...playground.piles.map(p => p.dom.element));
        const foundationsWrapper = elt("div", {className: "foundation-wrapper"},
                                    ...playground.foundations.map(f => f.dom.element));
                                    

        this.element = elt("div", {className: "playground"}, 
                            elt("header", null, storesWrapper, foundationsWrapper), 
                            pilesWrapper
                );
    }
}


// checks if rectangle A overlaps rectangleB

function doOverlap(a1, a2, b1, b2){
    if(a1.x === b1.x || a1.y === b2.y || a2.x === b2.x || a2.y === b2.y) return false;

    if(a1.x >= b2.x || a2.x >= b1.x) return false;

    if(a1.y <= b2.y || a2.y <= b1.y) return false;

    return true;
}



const playground = factory.createPlayground();
document.body.appendChild(playground.dom.element);


setTimeout(() => playground.distributeCards(), 2000);