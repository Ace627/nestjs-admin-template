import { describe, expect, it } from 'vitest'

import { listToTree, treeToList } from './tree-helper'

interface TreeNode {
  id: number
  parentId: number
  name: string
  children?: TreeNode[]
}

interface MenuNode {
  menuId: number
  pid: number
  name: string
  sub?: MenuNode[]
}

interface SubNode {
  id: number
  sub?: SubNode[]
}

describe('listToTree', () => {
  it('按 parentId 组装多层级树，根节点保持原始顺序', () => {
    const list: TreeNode[] = [
      { id: 1, parentId: 0, name: '一级' },
      { id: 2, parentId: 1, name: '二级' },
      { id: 3, parentId: 2, name: '三级' },
      { id: 4, parentId: 1, name: '二级-2' },
      { id: 5, parentId: 0, name: '一级-2' },
    ]

    const tree = listToTree<TreeNode>(list)

    expect(tree.map((node) => node.id)).toEqual([1, 5])
    expect(tree[0].children?.map((node) => node.id)).toEqual([2, 4])
    expect(tree[0].children?.[0].children?.map((node) => node.id)).toEqual([3])
    expect(tree[0].children?.[0].children?.[0].children).toEqual([])
    expect(tree[1].children).toEqual([])
  })

  it('父节点不存在的节点作为根节点，且父节点不要求排在子节点之前', () => {
    const list: TreeNode[] = [
      { id: 2, parentId: 1, name: '子' },
      { id: 1, parentId: 0, name: '父' },
      { id: 3, parentId: 999, name: '孤儿' },
    ]

    const tree = listToTree<TreeNode>(list)

    expect(tree.map((node) => node.id)).toEqual([1, 3])
    expect(tree[0].children?.map((node) => node.id)).toEqual([2])
  })

  it('节点原有 children 会保留，缺失时补空数组', () => {
    const list: TreeNode[] = [
      { id: 1, parentId: 0, name: '父', children: [{ id: 9, parentId: 1, name: '已有子' }] },
      { id: 2, parentId: 1, name: '新子' },
    ]

    const tree = listToTree<TreeNode>(list)

    expect(tree[0].children?.map((node) => node.id)).toEqual([9, 2])
  })

  it('空列表返回空数组', () => {
    expect(listToTree<TreeNode>([])).toEqual([])
  })

  it('支持自定义 id / parentId / children 字段名', () => {
    const list: MenuNode[] = [
      { menuId: 1, pid: 0, sub: undefined, name: '菜单' },
      { menuId: 2, pid: 1, name: '子菜单' },
    ]

    const tree = listToTree<MenuNode>(list, { id: 'menuId', parentId: 'pid', children: 'sub' })

    expect(tree).toHaveLength(1)
    expect(tree[0].menuId).toBe(1)
    expect(tree[0].sub?.map((node) => node.menuId)).toEqual([2])
  })

  it('返回的节点与入参为同一批对象引用', () => {
    const child: TreeNode = { id: 2, parentId: 1, name: '子' }
    const parent: TreeNode = { id: 1, parentId: 0, name: '父' }

    const tree = listToTree<TreeNode>([parent, child])

    expect(tree[0]).toBe(parent)
    expect(tree[0].children?.[0]).toBe(child)
  })
})

describe('treeToList', () => {
  it('展开为深度优先的先序列表', () => {
    const tree: TreeNode[] = [
      {
        id: 1,
        parentId: 0,
        name: '一级',
        children: [
          { id: 2, parentId: 1, name: '二级', children: [{ id: 3, parentId: 2, name: '三级' }] },
          { id: 4, parentId: 1, name: '二级-2' },
        ],
      },
      { id: 5, parentId: 0, name: '一级-2' },
    ]

    const list = treeToList<TreeNode>(tree)

    expect(list.map((node) => node.id)).toEqual([1, 2, 3, 4, 5])
  })

  it('移除所有节点的 children 字段，保证列表扁平', () => {
    const tree: TreeNode[] = [{ id: 1, parentId: 0, name: '父', children: [{ id: 2, parentId: 1, name: '子' }] }]

    const list = treeToList<TreeNode>(tree)

    expect(list.every((node) => !('children' in node))).toBe(true)
  })

  it('叶子节点与空子数组不影响结果', () => {
    const tree: TreeNode[] = [
      { id: 1, parentId: 0, name: '无子' },
      { id: 2, parentId: 0, name: '空子', children: [] },
    ]

    expect(treeToList<TreeNode>(tree).map((node) => node.id)).toEqual([1, 2])
  })

  it('空树返回空数组', () => {
    expect(treeToList<TreeNode>([])).toEqual([])
  })

  it('支持自定义 children 字段名', () => {
    const tree: SubNode[] = [{ id: 1, sub: [{ id: 2 }] }]

    const list = treeToList<SubNode>(tree, { children: 'sub' })

    expect(list.map((node) => node.id)).toEqual([1, 2])
    expect('sub' in list[0]).toBe(false)
  })

  it('与 listToTree 组合后能还原扁平列表', () => {
    const list: TreeNode[] = [
      { id: 1, parentId: 0, name: '一级' },
      { id: 2, parentId: 1, name: '二级' },
      { id: 3, parentId: 0, name: '一级-2' },
    ]

    const result = treeToList<TreeNode>(listToTree<TreeNode>(list))

    expect(result.map((node) => node.id)).toEqual([1, 2, 3])
  })
})
