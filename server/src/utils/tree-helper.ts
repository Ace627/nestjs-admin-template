interface TreeHelperConfig {
  id: string // 节点唯一标识字段名
  children: string // 子节点列表字段名
  parentId: string // 父节点标识字段名
}

const DEFAULT_CONFIG: TreeHelperConfig = { id: 'id', children: 'children', parentId: 'parentId' }

export function listToTree<T = any>(list: any[], config: Partial<TreeHelperConfig> = {}): T[] {
  const { id, parentId, children } = Object.assign({}, DEFAULT_CONFIG, config)
  const nodeMap = new Map() // 节点映射表（id -> 节点），用于快速查找父节点
  const treeList: T[] = [] // 最终树形结构数组（根节点列表）
  // 初始化节点映射表，给每个节点初始化子节点数组
  for (const node of list) {
    node[children] = node[children] || []
    nodeMap.set(node[id], node)
  }
  // 遍历节点，根据 parentId 挂载到对应父节点的 children 中
  for (const node of list) {
    const parent = nodeMap.get(node[parentId])
    ;(parent ? parent[children] : treeList).push(node)
  }
  return treeList
}

export function treeToList<T = any>(tree: any, config: Partial<TreeHelperConfig> = {}): T[] {
  const { children } = Object.assign({}, DEFAULT_CONFIG, config)
  const list = [...tree] // 初始化列表（先放入根节点）
  // 遍历列表，展开子节点并插入到当前节点后
  for (let i = 0; i < list.length; i++) {
    if (!list[i][children]) continue // 无自节点则跳过
    // 将子节点插入到当前节点下一位
    list.splice(i + 1, 0, ...list[i][children])
    delete list[i][children] // 移除原节点的 children 字段，保证列表扁平
  }
  return list
}
