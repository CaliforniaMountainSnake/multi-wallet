import {DoublyLinkedListRepository, Node, NodeKey, NodeStore, NodeStoreTransaction} from "./DoublyLinkedListRepository";
import {BasicIndexedDBRepository} from "./BasicIndexedDBRepository";

export class IndexedDbNodeStore<N extends Node> implements NodeStore<N> {
    public readonly nullishKey = 0;
    public readonly repository: BasicIndexedDBRepository;
    public readonly indexes = {
        prevNodeKey: "prevNodeKeyIndex",
        nextNodeKey: "nextNodeKeyIndex",
    };
    private readonly store: string;

    constructor(repository: BasicIndexedDBRepository, store: string) {
        this.repository = repository;
        this.store = store;
    }

    async migrateStoreToDoublyLinkedList(transaction: IDBTransaction, dllRepository: DoublyLinkedListRepository<N>) {
        const store = transaction.objectStore(this.store);
        const storeTransaction = new IndexedDbNodeStoreTransaction<N>(this, transaction, store);
        await dllRepository.mutateNodesToDoublyLinkedList(storeTransaction);

        // Create indexes.
        store.createIndex(this.indexes.prevNodeKey, "prevNodeKey");
        store.createIndex(this.indexes.nextNodeKey, "nextNodeKey");
    }

    async transaction<R>(
        body: (transaction: NodeStoreTransaction<N>) => Promise<R>,
        mode: "readonly" | "readwrite"
    ): Promise<R> {
        return await this.repository.transaction(async transaction => {
            const store = transaction.objectStore(this.store);
            const storeTransaction = new IndexedDbNodeStoreTransaction<N>(this, transaction, store);
            return body(storeTransaction);
        }, mode);
    }
}

class IndexedDbNodeStoreTransaction<N extends Node> implements NodeStoreTransaction<N> {
    private readonly nodeStore: IndexedDbNodeStore<N>;
    private readonly transaction: IDBTransaction;
    private readonly store: IDBObjectStore;

    constructor(nodeStore: IndexedDbNodeStore<N>, transaction: IDBTransaction, store: IDBObjectStore) {
        this.nodeStore = nodeStore;
        this.transaction = transaction;
        this.store = store;
    }

    async create(node: N): Promise<NodeKey> {
        return await this.nodeStore.repository.promiseRequest(this.store.add(node)) as NodeKey;
    }

    async update(key: NodeKey, node: N): Promise<void> {
        await this.nodeStore.repository.promiseRequest(this.store.put(node, key));
    }

    async delete(key: NodeKey): Promise<void> {
        return this.nodeStore.repository.promiseRequest(this.store.delete(key));
    }

    async get(key: NodeKey): Promise<N | undefined> {
        return await this.nodeStore.repository.promiseRequest(this.store.get(key));
    }

    async getOrThrow(key: NodeKey): Promise<N> {
        const node = await this.get(key);
        if (node === undefined) {
            throw new Error(`Unable to find a row with key: "${key}"!`);
        }
        return node;
    }

    async forEach(callback: (node: N, key: NodeKey) => Promise<void>): Promise<void> {
        const nodes = await this.nodeStore.repository.promiseCursorRequest<NodeKey, N>(this.store.openCursor());
        for (const [key, node] of nodes) {
            await callback(node, key);
        }
    }

    async getFirstNodeKey(): Promise<NodeKey> {
        const prevIndex = this.store.index(this.nodeStore.indexes.prevNodeKey);
        const firstKeyRequest = prevIndex.getKey(this.nodeStore.nullishKey) as IDBRequest<NodeKey | undefined>;
        return await this.nodeStore.repository.promiseRequest(firstKeyRequest) ?? this.nodeStore.nullishKey;
    }

    async getLastNodeKey(): Promise<NodeKey> {
        const nextIndex = this.store.index(this.nodeStore.indexes.nextNodeKey);
        const lastKeyRequest = nextIndex.getKey(this.nodeStore.nullishKey) as IDBRequest<NodeKey | undefined>;
        return await this.nodeStore.repository.promiseRequest(lastKeyRequest) ?? this.nodeStore.nullishKey;
    }
}
