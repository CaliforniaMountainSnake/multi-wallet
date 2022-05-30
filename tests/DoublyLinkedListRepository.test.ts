import {
    DoublyLinkedListRepository,
    Node,
    NodeKey,
    NodeStore,
    NodeStoreTransaction
} from "../src/repositories/DoublyLinkedListRepository";

test("mutate: empty store", () => {
    const map: Map<number, Node> = new Map();
    const expectedMap: Map<number, Node> = new Map();

    const store = new MapTestNodeStore(map);
    const repository = new DoublyLinkedListRepository(store);
    return repository.mutateNodesToDoublyLinkedList(store).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("mutate: 1 item", () => {
    const map: Map<number, Node> = new Map([
        [23, {prevNodeKey: 244, nextNodeKey: 502}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [23, {prevNodeKey: 0, nextNodeKey: 0}],
    ]);

    const store = new MapTestNodeStore(map);
    const repository = new DoublyLinkedListRepository(store);
    return repository.mutateNodesToDoublyLinkedList(store).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("mutate: many items", () => {
    const map: Map<number, Node> = new Map([
        [1, {prevNodeKey: 0, nextNodeKey: 0}],
        [17, {prevNodeKey: 0, nextNodeKey: 0}],
        [3, {prevNodeKey: 0, nextNodeKey: 0}],
        [141, {prevNodeKey: 0, nextNodeKey: 0}],
        [5, {prevNodeKey: 0, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [1, {prevNodeKey: 0, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 141}],
        [141, {prevNodeKey: 3, nextNodeKey: 5}],
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
    ]);

    const store = new MapTestNodeStore(map);
    const repository = new DoublyLinkedListRepository(store);
    return repository.mutateNodesToDoublyLinkedList(store).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

//------------------------------------------------------------------------------
test("moveDown: invalid key", () => {
    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(new Map()));
    return repository.moveDown(17).then(() => {
        throw new Error("invalid!");
    }).catch(error => {
        expect(error).toBeInstanceOf(Error);
    });
});

test("moveDown: 1 item", () => {
    const map: Map<number, Node> = new Map([
        [17, {prevNodeKey: 103, nextNodeKey: 507}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [17, {prevNodeKey: 103, nextNodeKey: 507}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.moveDown(17).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("moveDown: 2 items", () => {
    const map: Map<number, Node> = new Map([
        [17, {prevNodeKey: 0, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [3, {prevNodeKey: 0, nextNodeKey: 17}],
        [17, {prevNodeKey: 3, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.moveDown(17).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("moveDown: last item", () => {
    const map: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.moveDown(3).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("moveDown: first item", () => {
    const map: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [1, {prevNodeKey: 0, nextNodeKey: 70}],
        [70, {prevNodeKey: 1, nextNodeKey: 17}],
        [17, {prevNodeKey: 70, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.moveDown(70).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("moveDown: many items", () => {
    const map: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 141}],
        [141, {prevNodeKey: 3, nextNodeKey: 5}],
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 3}], // changed
        [3, {prevNodeKey: 1, nextNodeKey: 17}], // flipped
        [17, {prevNodeKey: 3, nextNodeKey: 141}], // flipped
        [141, {prevNodeKey: 17, nextNodeKey: 5}], // changed
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.moveDown(17).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

//------------------------------------------------------------------------------
test("moveUp: invalid key", () => {
    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(new Map()));
    return repository.moveUp(17).then(() => {
        throw new Error("invalid!");
    }).catch(error => {
        expect(error).toBeInstanceOf(Error);
    });
});

test("moveUp: 1 item", () => {
    const map: Map<number, Node> = new Map([
        [17, {prevNodeKey: 0, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [17, {prevNodeKey: 0, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.moveUp(17).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("moveUp: 2 items", () => {
    const map: Map<number, Node> = new Map([
        [17, {prevNodeKey: 0, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [3, {prevNodeKey: 0, nextNodeKey: 17}],
        [17, {prevNodeKey: 3, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.moveUp(3).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("moveUp: first item", () => {
    const map: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.moveUp(70).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("moveUp: last item", () => {
    const map: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 3}],
        [3, {prevNodeKey: 1, nextNodeKey: 17}],
        [17, {prevNodeKey: 3, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.moveUp(3).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("moveUp: many items", () => {
    const map: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 141}],
        [141, {prevNodeKey: 3, nextNodeKey: 5}],
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 3}], // changed
        [3, {prevNodeKey: 1, nextNodeKey: 17}], // flipped
        [17, {prevNodeKey: 3, nextNodeKey: 141}], // flipped
        [141, {prevNodeKey: 17, nextNodeKey: 5}], // changed
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.moveUp(3).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

//------------------------------------------------------------------------------
test("delete: invalid key", () => {
    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(new Map()));
    return repository.delete(17).then(() => {
        throw new Error("invalid!");
    }).catch(error => {
        expect(error).toBeInstanceOf(Error);
    });
});

test("delete: 1 item", () => {
    const map: Map<number, Node> = new Map([
        [17, {prevNodeKey: 0, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map();

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.delete(17).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("delete: first item", () => {
    const map: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [1, {prevNodeKey: 0, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.delete(70).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("delete: last item", () => {
    const map: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.delete(3).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("delete: many items", () => {
    const map: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 141}],
        [141, {prevNodeKey: 3, nextNodeKey: 5}],
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}], // changed
        [17, {prevNodeKey: 1, nextNodeKey: 141}], // changed
        [141, {prevNodeKey: 17, nextNodeKey: 5}],
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.delete(3).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

//------------------------------------------------------------------------------
test("getAll: empty store", () => {
    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(new Map()));
    return repository.getAll("asc").then(resultMap => {
        expect(resultMap).toEqual(new Map());
    });
});

test("getAll: asc", () => {
    const map: Map<number, Node> = new Map([
        [141, {prevNodeKey: 3, nextNodeKey: 5}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
        [3, {prevNodeKey: 17, nextNodeKey: 141}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 141}],
        [141, {prevNodeKey: 3, nextNodeKey: 5}],
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.getAll("asc").then(resultMap => {
        // Convert to array to validate order.
        const resultArr = Array.from(resultMap.values());
        const expectedArr = Array.from(expectedMap.values());
        for (const [i, node] of resultArr.entries()) {
            expect(node).toEqual(expectedArr[i]);
        }
    });
});

test("getAll: desc", () => {
    const map: Map<number, Node> = new Map([
        [141, {prevNodeKey: 3, nextNodeKey: 5}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
        [3, {prevNodeKey: 17, nextNodeKey: 141}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
        [141, {prevNodeKey: 3, nextNodeKey: 5}],
        [3, {prevNodeKey: 17, nextNodeKey: 141}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
    ]);

    const repository = new DoublyLinkedListRepository(new MapTestNodeStore(map));
    return repository.getAll("desc").then(resultMap => {
        // Convert to array to validate order.
        const resultArr = Array.from(resultMap.values());
        const expectedArr = Array.from(expectedMap.values());
        for (const [i, node] of resultArr.entries()) {
            expect(node).toEqual(expectedArr[i]);
        }
    });
});

//------------------------------------------------------------------------------
test("glueNeighbors: invalid key", () => {
    const store = new MapTestNodeStore(new Map());
    const repository = new DoublyLinkedListRepository(store);
    return repository.excludeAndGlueNeighbors(17, store).then(() => {
        throw new Error("invalid!");
    }).catch(error => {
        expect(error).toBeInstanceOf(Error);
    });
});

test("glueNeighbors: 1 item", () => {
    const map: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 0}],
    ]);

    const store = new MapTestNodeStore(map);
    const repository = new DoublyLinkedListRepository(store);
    return repository.excludeAndGlueNeighbors(70, store).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("glueNeighbors: first item", () => {
    const map: Map<number, Node> = new Map([
        [1, {prevNodeKey: 0, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [1, {prevNodeKey: 0, nextNodeKey: 17}],
        [17, {prevNodeKey: 0, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);

    const store = new MapTestNodeStore(map);
    const repository = new DoublyLinkedListRepository(store);
    return repository.excludeAndGlueNeighbors(1, store).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("glueNeighbors: last item", () => {
    const map: Map<number, Node> = new Map([
        [1, {prevNodeKey: 0, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [1, {prevNodeKey: 0, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 0}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);

    const store = new MapTestNodeStore(map);
    const repository = new DoublyLinkedListRepository(store);
    return repository.excludeAndGlueNeighbors(3, store).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("glueNeighbors: middle item", () => {
    const map: Map<number, Node> = new Map([
        [1, {prevNodeKey: 0, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [1, {prevNodeKey: 0, nextNodeKey: 3}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 1, nextNodeKey: 0}],
    ]);

    const store = new MapTestNodeStore(map);
    const repository = new DoublyLinkedListRepository(store);
    return repository.excludeAndGlueNeighbors(17, store).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

test("glueNeighbors: many items", () => {
    const map: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 141}],
        [141, {prevNodeKey: 3, nextNodeKey: 5}],
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
    ]);
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 3}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 1, nextNodeKey: 141}],
        [141, {prevNodeKey: 3, nextNodeKey: 5}],
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
    ]);

    const store = new MapTestNodeStore(map);
    const repository = new DoublyLinkedListRepository(store);
    return repository.excludeAndGlueNeighbors(17, store).then(() => {
        expect(map).toEqual(expectedMap);
    });
});

//------------------------------------------------------------------------------
test("placeAfter: wrong node key", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 0}],
    ]));
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(store);
    return repository.placeAfter(500, 17, store).then(() => {
        throw new Error("invalid!");
    }).catch(error => {
        expect(error).toBeInstanceOf(Error);
        expect(store.map).toEqual(expectedMap);
    });
});

test("placeAfter: wrong target key", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 0}],
    ]));
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(store);
    return repository.placeAfter(17, 500, store).then(() => {
        throw new Error("invalid!");
    }).catch(error => {
        expect(error).toBeInstanceOf(Error);
        expect(store.map).toEqual(expectedMap);
    });
});

test("placeAfter: the same item", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 503, nextNodeKey: 802}],
    ]));
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 503, nextNodeKey: 802}],
    ]);

    const repository = new DoublyLinkedListRepository(store);
    return repository.placeAfter(70, 70, store).then(() => {
        expect(store.map).toEqual(expectedMap);
    });
});

test("placeAfter: 2 items", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 0}],
    ]));
    const expectedMap: Map<number, Node> = new Map([
        [1, {prevNodeKey: 0, nextNodeKey: 70}],
        [70, {prevNodeKey: 1, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(store);
    return repository.placeAfter(70, 1, store).then(() => {
        expect(store.map).toEqual(expectedMap);
    });
});

test("placeAfter: first to last", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]));
    const expectedMap: Map<number, Node> = new Map([
        [1, {prevNodeKey: 0, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 70}],
        [70, {prevNodeKey: 3, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(store);
    return repository.placeAfter(70, 3, store).then(() => {
        expect(store.map).toEqual(expectedMap);
    });
});

test("placeAfter: many items", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 141}],
        [141, {prevNodeKey: 3, nextNodeKey: 5}],
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
    ]));
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 141}],
        [141, {prevNodeKey: 1, nextNodeKey: 17}],
        [17, {prevNodeKey: 141, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 5}],
        [5, {prevNodeKey: 3, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(store);
    return repository.placeAfter(141, 1, store).then(() => {
        expect(store.map).toEqual(expectedMap);
    });
});

//------------------------------------------------------------------------------
test("placeBefore: wrong node key", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 0}],
    ]));
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(store);
    return repository.placeBefore(500, 17, store).then(() => {
        throw new Error("invalid!");
    }).catch(error => {
        expect(error).toBeInstanceOf(Error);
        expect(store.map).toEqual(expectedMap);
    });
});

test("placeBefore: wrong target key", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 0}],
    ]));
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(store);
    return repository.placeBefore(17, 500, store).then(() => {
        throw new Error("invalid!");
    }).catch(error => {
        expect(error).toBeInstanceOf(Error);
        expect(store.map).toEqual(expectedMap);
    });
});

test("placeBefore: the same item", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 503, nextNodeKey: 802}],
    ]));
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 503, nextNodeKey: 802}],
    ]);

    const repository = new DoublyLinkedListRepository(store);
    return repository.placeBefore(70, 70, store).then(() => {
        expect(store.map).toEqual(expectedMap);
    });
});

test("placeBefore: 2 items", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 0}],
    ]));
    const expectedMap: Map<number, Node> = new Map([
        [1, {prevNodeKey: 0, nextNodeKey: 70}],
        [70, {prevNodeKey: 1, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(store);
    return repository.placeBefore(1, 70, store).then(() => {
        expect(store.map).toEqual(expectedMap);
    });
});

test("placeBefore: last to first", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 0}],
    ]));
    const expectedMap: Map<number, Node> = new Map([
        [3, {prevNodeKey: 0, nextNodeKey: 70}],
        [70, {prevNodeKey: 3, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(store);
    return repository.placeBefore(3, 70, store).then(() => {
        expect(store.map).toEqual(expectedMap);
    });
});

test("placeBefore: many items", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 141}],
        [141, {prevNodeKey: 3, nextNodeKey: 5}],
        [5, {prevNodeKey: 141, nextNodeKey: 0}],
    ]));
    const expectedMap: Map<number, Node> = new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 141}],
        [141, {prevNodeKey: 1, nextNodeKey: 17}],
        [17, {prevNodeKey: 141, nextNodeKey: 3}],
        [3, {prevNodeKey: 17, nextNodeKey: 5}],
        [5, {prevNodeKey: 3, nextNodeKey: 0}],
    ]);

    const repository = new DoublyLinkedListRepository(store);
    return repository.placeBefore(141, 17, store).then(() => {
        expect(store.map).toEqual(expectedMap);
    });
});

//------------------------------------------------------------------------------
test("addToEnd: empty store, node's keys should be set to nullish key.", () => {
    const store = new MapTestNodeStore(new Map());
    const repository = new DoublyLinkedListRepository(store);
    return repository.addToEnd({
        prevNodeKey: 242,
        nextNodeKey: 42,
    }).then(addedKey => {
        const expectedMap: Map<number, Node> = new Map([
            [addedKey, {prevNodeKey: 0, nextNodeKey: 0}],
        ]);

        expect(store.map).toEqual(expectedMap);
    });
});

test("addToEnd: 1 item", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 0}],
    ]));

    const repository = new DoublyLinkedListRepository(store);
    return repository.addToEnd({
        prevNodeKey: 242,
        nextNodeKey: 42,
    }).then(addedKey => {
        const expectedMap: Map<number, Node> = new Map([
            [70, {prevNodeKey: 0, nextNodeKey: addedKey}],
            [addedKey, {prevNodeKey: 70, nextNodeKey: 0}],
        ]);

        expect(store.map).toEqual(expectedMap);
    });
});

test("addToEnd: many items", () => {
    const store = new MapTestNodeStore(new Map([
        [70, {prevNodeKey: 0, nextNodeKey: 1}],
        [1, {prevNodeKey: 70, nextNodeKey: 17}],
        [17, {prevNodeKey: 1, nextNodeKey: 0}],
    ]));

    const repository = new DoublyLinkedListRepository(store);
    return repository.addToEnd({
        prevNodeKey: 242,
        nextNodeKey: 42,
    }).then(addedKey => {
        const expectedMap: Map<number, Node> = new Map([
            [70, {prevNodeKey: 0, nextNodeKey: 1}],
            [1, {prevNodeKey: 70, nextNodeKey: 17}],
            [17, {prevNodeKey: 1, nextNodeKey: addedKey}],
            [addedKey, {prevNodeKey: 17, nextNodeKey: 0}],
        ]);

        expect(store.map).toEqual(expectedMap);
    });
});

//------------------------------------------------------------------------------
/**
 * Special implementation of NodeStore for testing purposes.
 */
class MapTestNodeStore implements NodeStoreTransaction<Node>, NodeStore<Node> {
    public nullishKey = 0;
    public map: Map<number, Node>;

    constructor(map: Map<number, Node>) {
        this.map = map;
    }

    async create(node: Node): Promise<NodeKey> {
        const key = Date.now();
        this.map.set(key, node);
        return key;
    }

    async delete(key: NodeKey): Promise<void> {
        this.map.delete(key);
    }

    async get(key: NodeKey): Promise<Node | undefined> {
        const node = this.map.get(key);
        if (node === undefined) {
            return undefined;
        }

        // !VERY IMPORTANT: return a cloned value to avoid direct access to store's memory.
        const clonedValue = Object.assign({}, node);
        return Promise.resolve(clonedValue);
    }

    async getOrThrow(key: NodeKey): Promise<Node> {
        const node = await this.get(key);
        if (node === undefined) {
            throw new Error(`Unable to found a node with key "${key}"!`);
        }
        return node;
    }

    async getFirstNodeKey(): Promise<NodeKey> {
        for (const [key, node] of this.map.entries()) {
            if (node.prevNodeKey === this.nullishKey) {
                return key;
            }
        }
        return this.nullishKey;
    }

    async getLastNodeKey(): Promise<NodeKey> {
        for (const [key, node] of this.map.entries()) {
            if (node.nextNodeKey === this.nullishKey) {
                return key;
            }
        }
        return this.nullishKey;
    }

    async update(key: NodeKey, node: Node): Promise<void> {
        this.map.set(key, node);
    }

    forEach(callback: (node: Node, key: NodeKey) => Promise<any>): Promise<void> {
        return new Promise((resolve, reject) => {
            this.map.forEach((value, key) => {
                callback(value, key).catch(reject);
            });
            resolve();
        });
    }

    async transaction<R>(body: (transaction: NodeStoreTransaction<Node>) => Promise<R>,
                         mode: "readonly" | "readwrite"): Promise<R> {
        return body(this);
    }
}
