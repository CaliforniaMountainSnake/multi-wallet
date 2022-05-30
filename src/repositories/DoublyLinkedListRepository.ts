/**
 * Node key must have a primitive type to allow you to copy keys by value.
 */
export type NodeKey = number;

/**
 * A node of a doubly linked list.
 *
 * In IndexedDB, index uses an object field as a key.
 * In IndexedDB, a value can have any type, but a key must be IDBValidKey.
 * So, this field must have IDBValidKey type, otherwise you cannot query this value, because it is not a valid key...
 * This means that you cannot use nullish values (undefined/null) to mark non-existed value if this value is used as a key.
 * You must use IDBValidKey value for this case. For example, you can use a kind of "nullish" value.
 */
export interface Node {
    prevNodeKey: NodeKey,
    nextNodeKey: NodeKey,
}

export interface NodeStore<N extends Node> {
    nullishKey: NodeKey,
    transaction: <R> (
        body: (transaction: NodeStoreTransaction<N>) => Promise<R>,
        mode: "readonly" | "readwrite",
    ) => Promise<R>;
}

/**
 * Implement to provide a storage mechanism for a doubly linked list.
 */
export interface NodeStoreTransaction<N extends Node> {
    create: (node: N) => Promise<NodeKey>,
    update: (key: NodeKey, node: N) => Promise<void>,
    delete: (key: NodeKey) => Promise<void>,
    get: (key: NodeKey) => Promise<N | undefined>,
    getOrThrow: (key: NodeKey) => Promise<N>,
    getFirstNodeKey: () => Promise<NodeKey>,
    getLastNodeKey: () => Promise<NodeKey>,
    forEach: (callback: (node: N, key: NodeKey) => Promise<void>) => Promise<void>,
}

/**
 * This repository implements operations over a doubly linked list.
 */
export class DoublyLinkedListRepository<N extends Node> {
    public readonly store: NodeStore<N>;

    constructor(store: NodeStore<N>) {
        this.store = store;
    }

    async getAll(direction: "asc" | "desc" = "asc"): Promise<Map<NodeKey, N>> {
        return await this.store.transaction(async transaction => {
            const values = new Map<NodeKey, N>();
            const [firstNodeKey, lastNodeKey] = await Promise.all([
                transaction.getFirstNodeKey(),
                transaction.getLastNodeKey(),
            ]);

            let nextKey: NodeKey = direction === "asc" ? firstNodeKey : lastNodeKey;
            while (nextKey !== this.store.nullishKey) {
                const node = await transaction.getOrThrow(nextKey);
                values.set(nextKey, node);
                nextKey = direction === "asc" ? node.nextNodeKey : node.prevNodeKey;
            }

            return values;
        }, "readonly");
    }

    async delete(key: NodeKey): Promise<void> {
        return this.store.transaction(async transaction => {
            await this.excludeAndGlueNeighbors(key, transaction);
            await transaction.delete(key);
        }, "readwrite");
    }

    async moveUp(key: NodeKey): Promise<void> {
        return this.store.transaction(async transaction => {
            const node = await transaction.getOrThrow(key);
            const prevNode = await transaction.get(node.prevNodeKey);
            if (prevNode === undefined) {
                return;
            }

            await this.placeAfter(node.prevNodeKey, key, transaction);
        }, "readwrite");
    }

    async moveDown(key: NodeKey): Promise<void> {
        return this.store.transaction(async transaction => {
            const node = await transaction.getOrThrow(key);
            const nextNode = await transaction.get(node.nextNodeKey);
            if (nextNode === undefined) {
                return;
            }

            await this.placeAfter(key, node.nextNodeKey, transaction);
        }, "readwrite");
    }

    async addToEnd(node: N): Promise<NodeKey> {
        return this.store.transaction(async transaction => {
            const lastKey = await transaction.getLastNodeKey();
            const key = await transaction.create(node);
            if (lastKey === this.store.nullishKey) {
                // This is the first node in the store, nullish its keys.
                node.prevNodeKey = this.store.nullishKey;
                node.nextNodeKey = this.store.nullishKey;
                await transaction.update(key, node);
            } else {
                await this.placeAfter(key, lastKey, transaction);
            }

            return key;
        }, "readwrite");
    }

    async put(node: N, key: NodeKey = this.store.nullishKey): Promise<NodeKey> {
        if (key === this.store.nullishKey) {
            return this.addToEnd(node);
        }

        return this.store.transaction(async transaction => {
            await transaction.update(key, node);
            return key;
        }, "readwrite");
    }

    async mutateNodesToDoublyLinkedList(transaction: NodeStoreTransaction<N>): Promise<void> {
        let prevNodeKey: NodeKey = this.store.nullishKey;
        let prevNode: N | undefined = undefined;
        return transaction.forEach(async (node, key) => {
            node.prevNodeKey = prevNodeKey;
            node.nextNodeKey = this.store.nullishKey;
            transaction.update(key, node);

            if (prevNode !== undefined) {
                prevNode.nextNodeKey = key;
                transaction.update(prevNodeKey, prevNode);
            }

            prevNodeKey = key;
            prevNode = node;
        });
    }

    /**
     * Glue prev and next nodes of the given node.
     * The given node will be logically excluded from the list.
     * The given node itself is not affected.
     */
    async excludeAndGlueNeighbors(key: NodeKey, transaction: NodeStoreTransaction<N>): Promise<void> {
        const node = await transaction.getOrThrow(key);
        const [prevNode, nextNode] = await Promise.all([
            transaction.get(node.prevNodeKey),
            transaction.get(node.nextNodeKey),
        ]);

        if (prevNode !== undefined) {
            prevNode.nextNodeKey = node.nextNodeKey;
        }
        if (nextNode !== undefined) {
            nextNode.prevNodeKey = node.prevNodeKey;
        }

        await Promise.all([
            prevNode === undefined ? undefined : transaction.update(node.prevNodeKey, prevNode),
            nextNode === undefined ? undefined : transaction.update(node.nextNodeKey, nextNode),
        ]);
    }

    async placeBefore(nodeKey: NodeKey, targetKey: NodeKey, transaction: NodeStoreTransaction<N>): Promise<void> {
        // This is not the fastest approach, but you need to support only 1 method.
        // Anyway, it only takes O(1) time.
        await this.placeAfter(nodeKey, targetKey, transaction);
        await this.placeAfter(targetKey, nodeKey, transaction);
    }

    /**
     * Place the node after another one.
     * Node's prev and next keys are not read here, but rewritten.
     */
    async placeAfter(nodeKey: NodeKey, targetKey: NodeKey, transaction: NodeStoreTransaction<N>): Promise<void> {
        if (nodeKey === targetKey) {
            return;
        }
        const [node] = await Promise.all([
            transaction.getOrThrow(nodeKey),
            transaction.getOrThrow(targetKey),// check target node exist.
        ]);
        await this.excludeAndGlueNeighbors(nodeKey, transaction);// may affect target node.
        const targetNode = await transaction.getOrThrow(targetKey);// get updated target node.

        const nextNode = await transaction.get(targetNode.nextNodeKey);
        if (nextNode !== undefined) {
            nextNode.prevNodeKey = nodeKey;
        }

        node.prevNodeKey = targetKey;
        node.nextNodeKey = targetNode.nextNodeKey;
        targetNode.nextNodeKey = nodeKey;

        await Promise.all([
            transaction.update(nodeKey, node),
            transaction.update(targetKey, targetNode),
            nextNode === undefined ? undefined : transaction.update(node.nextNodeKey, nextNode),
        ]);
    }
}
