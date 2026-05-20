import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Search,
  Trash2,
  Key,
  Copy,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Edit3,
  Download,
  CheckSquare,
  Square
} from 'lucide-react'
import { walletApi } from '../api'
const WALLET_TYPE_OPTIONS = [
  { value: 'evm', label: 'EVM', color: 'bg-wallet-evm-bg text-wallet-evm-text' },
  { value: 'solana', label: 'Solana', color: 'bg-wallet-solana-bg text-wallet-solana-text' },
  { value: 'sui', label: 'Sui', color: 'bg-wallet-sui-bg text-wallet-sui-text' }
]
const WALLET_TYPE_BADGE = {
  evm: 'bg-wallet-evm-bg text-wallet-evm-text',
  solana: 'bg-wallet-solana-bg text-wallet-solana-text',
  sui: 'bg-wallet-sui-bg text-wallet-sui-text'
}
const truncateAddress = (addr) =>
  addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr
const Wallets = () => {
  const { t } = useTranslation()
  const [wallets, setWallets] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showBatchBar, setShowBatchBar] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createTab, setCreateTab] = useState('keypair')
  const [createType, setCreateType] = useState('evm')
  const [generatedKey, setGeneratedKey] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatedMnemonic, setGeneratedMnemonic] = useState('')
  const [generatingMnemonic, setGeneratingMnemonic] = useState(false)
  const [mnemonicImportTypes, setMnemonicImportTypes] = useState(['evm'])
  const [mnemonicDeriveCount, setMnemonicDeriveCount] = useState(1)
  const [mnemonicDerivedResults, setMnemonicDerivedResults] = useState([])
  const [mnemonicDeriving, setMnemonicDeriving] = useState(false)
  const [mnemonicSaving, setMnemonicSaving] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [mnemonic, setMnemonic] = useState('')
  const [importTypes, setImportTypes] = useState(['evm'])
  const [deriveCount, setDeriveCount] = useState(1)
  const [derivedResults, setDerivedResults] = useState([])
  const [deriving, setDeriving] = useState(false)
  const [importSaving, setImportSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [showBatchConfirm, setShowBatchConfirm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editLabels, setEditLabels] = useState([])
  const [editLabelInput, setEditLabelInput] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [visiblePrivateKeys, setVisiblePrivateKeys] = useState(new Set())
  const [privateKeyMap, setPrivateKeyMap] = useState({})
  const [copiedId, setCopiedId] = useState(null)
  const [copiedPkId, setCopiedPkId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const debounceTimer = useRef(null)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [search])
  const showError = (msg) => {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(''), 3000)
  }
  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 2000)
  }
  const fetchWallets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await walletApi.list(page, pageSize, debouncedSearch)
      setWallets(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch {
      setWallets([])
      showError(t('wallets.operationFailed'))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, t])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchWallets()
  }, [fetchWallets])
  const handleCopy = async (text, id, type) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'address') setCopiedId(id)
      else setCopiedPkId(id)
      setTimeout(() => {
        if (type === 'address') setCopiedId(null)
        else setCopiedPkId(null)
      }, 2000)
    } catch {
      showError(t('wallets.operationFailed'))
    }
  }
  const togglePrivateKey = async (wallet) => {
    if (visiblePrivateKeys.has(wallet.id)) {
      setVisiblePrivateKeys((prev) => {
        const next = new Set(prev)
        next.delete(wallet.id)
        return next
      })
      return
    }
    if (privateKeyMap[wallet.id]) {
      setVisiblePrivateKeys((prev) => new Set(prev).add(wallet.id))
      return
    }
    try {
      const full = await walletApi.get(wallet.id)
      if (full?.privateKey) {
        setPrivateKeyMap((prev) => ({ ...prev, [wallet.id]: full.privateKey }))
        setVisiblePrivateKeys((prev) => new Set(prev).add(wallet.id))
      } else {
        showError(t('wallets.operationFailed'))
      }
    } catch {
      showError(t('wallets.operationFailed'))
    }
  }
  const handleGenerate = async () => {
    setGenerating(true)
    setGeneratedKey(null)
    try {
      const result = await walletApi.generateKeypair(createType)
      setGeneratedKey({ address: result.address, privateKey: result.privateKey })
    } catch {
      showError(t('wallets.operationFailed'))
    } finally {
      setGenerating(false)
    }
  }
  const handleGenerateMnemonic = async () => {
    setGeneratingMnemonic(true)
    setGeneratedMnemonic('')
    setMnemonicDerivedResults([])
    try {
      const result = await walletApi.generateMnemonic()
      setGeneratedMnemonic(result)
    } catch {
      showError(t('wallets.operationFailed'))
    } finally {
      setGeneratingMnemonic(false)
    }
  }
  const handleDeriveFromGeneratedMnemonic = async () => {
    if (!generatedMnemonic || mnemonicImportTypes.length === 0) return
    setMnemonicDeriving(true)
    setMnemonicDerivedResults([])
    try {
      const results = await walletApi.deriveFromMnemonic(
        generatedMnemonic,
        mnemonicDeriveCount,
        mnemonicImportTypes
      )
      setMnemonicDerivedResults(results)
    } catch {
      showError(t('wallets.operationFailed'))
    } finally {
      setMnemonicDeriving(false)
    }
  }
  const handleSaveCreated = async () => {
    if (!generatedKey) return
    setSaving(true)
    try {
      await walletApi.create({
        address: generatedKey.address,
        privateKey: generatedKey.privateKey,
        mnemonic: null,
        walletType: createType,
        labels: []
      })
      closeCreateModal()
      fetchWallets()
      showSuccess(t('wallets.operationSuccess'))
    } catch {
      showError(t('wallets.operationFailed'))
    } finally {
      setSaving(false)
    }
  }
  const handleSaveMnemonicDerived = async () => {
    if (mnemonicDerivedResults.length === 0) return
    setMnemonicSaving(true)
    try {
      for (const item of mnemonicDerivedResults) {
        await walletApi.create({
          address: item.address,
          privateKey: item.privateKey,
          mnemonic: generatedMnemonic,
          walletType: item.walletType,
          labels: []
        })
      }
      closeCreateModal()
      fetchWallets()
      showSuccess(t('wallets.operationSuccess'))
    } catch {
      showError(t('wallets.operationFailed'))
    } finally {
      setMnemonicSaving(false)
    }
  }
  const handleDerive = async () => {
    if (importTypes.length === 0) return
    setDeriving(true)
    setDerivedResults([])
    try {
      const results = await walletApi.deriveFromMnemonic(mnemonic.trim(), deriveCount, importTypes)
      setDerivedResults(results)
    } catch {
      showError(t('wallets.operationFailed'))
    } finally {
      setDeriving(false)
    }
  }
  const handleSaveImported = async () => {
    if (derivedResults.length === 0) return
    setImportSaving(true)
    try {
      for (const item of derivedResults) {
        await walletApi.create({
          address: item.address,
          privateKey: item.privateKey,
          mnemonic: mnemonic.trim(),
          walletType: item.walletType,
          labels: []
        })
      }
      closeImportModal()
      fetchWallets()
      showSuccess(t('wallets.operationSuccess'))
    } catch {
      showError(t('wallets.operationFailed'))
    } finally {
      setImportSaving(false)
    }
  }
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await walletApi.delete(deleteTarget.id)
      setDeleteTarget(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(deleteTarget.id)
        return next
      })
      fetchWallets()
      showSuccess(t('wallets.operationSuccess'))
    } catch {
      showError(t('wallets.operationFailed'))
    } finally {
      setDeleting(false)
    }
  }
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    setBatchDeleting(true)
    try {
      await walletApi.batchDelete(Array.from(selectedIds))
      setSelectedIds(new Set())
      setShowBatchConfirm(false)
      setShowBatchBar(false)
      fetchWallets()
      showSuccess(t('wallets.operationSuccess'))
    } catch {
      showError(t('wallets.operationFailed'))
    } finally {
      setBatchDeleting(false)
    }
  }
  const handleEdit = (wallet) => {
    setEditTarget(wallet)
    setEditLabels([...wallet.labels])
    setEditLabelInput('')
  }
  const handleSaveEdit = async () => {
    if (!editTarget) return
    setEditSaving(true)
    try {
      await walletApi.update(editTarget.id, { labels: editLabels })
      setEditTarget(null)
      fetchWallets()
      showSuccess(t('wallets.operationSuccess'))
    } catch {
      showError(t('wallets.operationFailed'))
    } finally {
      setEditSaving(false)
    }
  }
  const addEditLabel = () => {
    const trimmed = editLabelInput.trim()
    if (trimmed && !editLabels.includes(trimmed)) {
      setEditLabels([...editLabels, trimmed])
    }
    setEditLabelInput('')
  }
  const removeEditLabel = (label) => {
    setEditLabels(editLabels.filter((l) => l !== label))
  }
  const handleEditLabelKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addEditLabel()
    }
  }
  const toggleImportType = (type) => {
    setImportTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }
  const toggleMnemonicImportType = (type) => {
    setMnemonicImportTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === wallets.length) {
      setSelectedIds(new Set())
      setShowBatchBar(false)
    } else {
      setSelectedIds(new Set(wallets.map((w) => w.id)))
      setShowBatchBar(true)
    }
  }
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      setShowBatchBar(next.size > 0)
      return next
    })
  }
  const handleExport = async () => {
    try {
      const res = await walletApi.list(1, 99999, '')
      const blob = new Blob([JSON.stringify(res.items, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wallets_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showSuccess(t('wallets.exportSuccess'))
    } catch {
      showError(t('wallets.exportError'))
    }
  }
  const closeCreateModal = () => {
    setShowCreateModal(false)
    setCreateTab('keypair')
    setCreateType('evm')
    setGeneratedKey(null)
    setGeneratedMnemonic('')
    setMnemonicImportTypes(['evm'])
    setMnemonicDeriveCount(1)
    setMnemonicDerivedResults([])
  }
  const closeImportModal = () => {
    setShowImportModal(false)
    setMnemonic('')
    setImportTypes(['evm'])
    setDeriveCount(1)
    setDerivedResults([])
  }
  const isAllSelected = wallets.length > 0 && selectedIds.size === wallets.length
  return _jsxs('div', {
    className: 'space-y-4',
    children: [
      (errorMsg || successMsg) &&
        _jsx('div', {
          className: `fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium transition-all ${errorMsg ? 'bg-danger text-white' : 'bg-success text-white'}`,
          children: errorMsg || successMsg
        }),
      _jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          _jsx('h1', {
            className: 'text-2xl font-bold text-text-primary',
            children: t('wallets.title')
          }),
          _jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              _jsxs('button', {
                onClick: () => setShowCreateModal(true),
                className:
                  'inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors',
                children: [_jsx(Plus, { size: 16 }), t('wallets.createWallet')]
              }),
              _jsxs('button', {
                onClick: () => setShowImportModal(true),
                className:
                  'inline-flex items-center gap-1.5 px-3 py-1.5 bg-success text-white text-sm font-medium rounded-lg hover:bg-success-hover transition-colors',
                children: [_jsx(Key, { size: 16 }), t('wallets.importWallet')]
              }),
              _jsxs('button', {
                onClick: handleExport,
                className:
                  'inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors',
                children: [_jsx(Download, { size: 16 }), t('wallets.exportWallets')]
              })
            ]
          })
        ]
      }),
      _jsxs('div', {
        className: 'relative',
        children: [
          _jsx(Search, {
            size: 16,
            className: 'absolute left-3 top-1/2 -translate-y-1/2 text-text-muted'
          }),
          _jsx('input', {
            type: 'text',
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: t('wallets.searchPlaceholder'),
            className:
              'w-full max-w-md pl-9 pr-3 py-2 border border-border-light rounded-lg text-sm bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
          })
        ]
      }),
      showBatchBar &&
        _jsxs('div', {
          className:
            'flex items-center gap-3 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-lg',
          children: [
            _jsx('span', {
              className: 'text-sm font-medium text-primary',
              children: t('wallets.selectedCount', { count: selectedIds.size })
            }),
            _jsx('button', {
              onClick: toggleSelectAll,
              className: 'text-sm text-primary hover:text-primary-hover underline',
              children: isAllSelected ? t('wallets.deselectAll') : t('wallets.selectAll')
            }),
            _jsx('div', { className: 'flex-1' }),
            _jsxs('button', {
              onClick: () => setShowBatchConfirm(true),
              className:
                'inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger text-white text-sm font-medium rounded-lg hover:bg-danger-hover transition-colors',
              children: [_jsx(Trash2, { size: 14 }), t('wallets.batchDelete')]
            })
          ]
        }),
      loading
        ? _jsx('div', {
            className: 'flex items-center justify-center py-20',
            children: _jsx('div', {
              className:
                'w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin'
            })
          })
        : wallets.length === 0
          ? _jsx('div', {
              className: 'flex items-center justify-center py-20 text-text-muted text-sm',
              children: t('wallets.noWallets')
            })
          : _jsxs(_Fragment, {
              children: [
                _jsx('div', {
                  className: 'bg-bg-card rounded-lg border border-border-light overflow-hidden',
                  children: _jsxs('table', {
                    className: 'w-full text-sm',
                    children: [
                      _jsx('thead', {
                        children: _jsxs('tr', {
                          className: 'border-b border-border-light bg-bg-tertiary',
                          children: [
                            _jsx('th', {
                              className: 'text-left px-4 py-3 w-10',
                              children: _jsx('button', {
                                onClick: toggleSelectAll,
                                className:
                                  'text-text-muted hover:text-text-primary transition-colors',
                                children: isAllSelected
                                  ? _jsx(CheckSquare, { size: 16 })
                                  : _jsx(Square, { size: 16 })
                              })
                            }),
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-text-muted',
                              children: t('wallets.address')
                            }),
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-text-muted',
                              children: t('wallets.walletType')
                            }),
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-text-muted',
                              children: t('wallets.privateKey')
                            }),
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-text-muted',
                              children: t('wallets.labels')
                            }),
                            _jsx('th', {
                              className: 'text-left px-4 py-3 font-medium text-text-muted',
                              children: t('wallets.createdAt')
                            }),
                            _jsx('th', {
                              className: 'text-right px-4 py-3 font-medium text-text-muted',
                              children: t('common.actions')
                            })
                          ]
                        })
                      }),
                      _jsx('tbody', {
                        children: wallets.map((wallet) => {
                          const isSelected = selectedIds.has(wallet.id)
                          const isPkVisible = visiblePrivateKeys.has(wallet.id)
                          const pk = privateKeyMap[wallet.id]
                          return _jsxs(
                            'tr',
                            {
                              className: `border-b border-border-light/50 hover:bg-bg-card-hover transition-colors ${isSelected ? 'bg-primary/5' : ''}`,
                              children: [
                                _jsx('td', {
                                  className: 'px-4 py-3',
                                  children: _jsx('button', {
                                    onClick: () => toggleSelect(wallet.id),
                                    className:
                                      'text-text-muted hover:text-text-primary transition-colors',
                                    children: isSelected
                                      ? _jsx(CheckSquare, { size: 16, className: 'text-primary' })
                                      : _jsx(Square, { size: 16 })
                                  })
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-3 font-mono text-xs text-text-primary',
                                  children: _jsxs('div', {
                                    className: 'flex items-center gap-1.5',
                                    children: [
                                      truncateAddress(wallet.address),
                                      _jsx('button', {
                                        onClick: () =>
                                          handleCopy(wallet.address, wallet.id, 'address'),
                                        className:
                                          'p-0.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-primary transition-colors',
                                        title: t('wallets.copyAddress'),
                                        children:
                                          copiedId === wallet.id
                                            ? _jsx('span', {
                                                className: 'text-xs text-success',
                                                children: t('wallets.copied')
                                              })
                                            : _jsx(Copy, { size: 12 })
                                      })
                                    ]
                                  })
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-3',
                                  children: _jsx('span', {
                                    className: `inline-block px-2 py-0.5 rounded text-xs font-medium ${WALLET_TYPE_BADGE[wallet.walletType] || 'bg-gray-100 text-gray-600'}`,
                                    children: wallet.walletType.toUpperCase()
                                  })
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-3',
                                  children: _jsxs('div', {
                                    className: 'flex items-center gap-1.5',
                                    children: [
                                      _jsx('span', {
                                        className: 'text-xs font-mono text-text-secondary',
                                        children: isPkVisible && pk ? pk : '••••••••'
                                      }),
                                      _jsx('button', {
                                        onClick: () => togglePrivateKey(wallet),
                                        className:
                                          'p-0.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-primary transition-colors',
                                        title: isPkVisible
                                          ? t('wallets.hidePrivateKey')
                                          : t('wallets.showPrivateKey'),
                                        children: isPkVisible
                                          ? _jsx(EyeOff, { size: 12 })
                                          : _jsx(Eye, { size: 12 })
                                      }),
                                      isPkVisible &&
                                        pk &&
                                        _jsx('button', {
                                          onClick: () => handleCopy(pk, wallet.id, 'pk'),
                                          className:
                                            'p-0.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-primary transition-colors',
                                          title: t('wallets.copyPrivateKey'),
                                          children:
                                            copiedPkId === wallet.id
                                              ? _jsx('span', {
                                                  className: 'text-xs text-success',
                                                  children: t('wallets.copied')
                                                })
                                              : _jsx(Copy, { size: 12 })
                                        })
                                    ]
                                  })
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-3',
                                  children: _jsx('div', {
                                    className: 'flex flex-wrap gap-1',
                                    children:
                                      wallet.labels.length > 0
                                        ? wallet.labels.map((label, i) =>
                                            _jsx(
                                              'span',
                                              {
                                                className:
                                                  'inline-block px-1.5 py-0.5 bg-bg-tertiary text-text-secondary rounded text-xs',
                                                children: label
                                              },
                                              i
                                            )
                                          )
                                        : _jsx('span', {
                                            className: 'text-text-muted',
                                            children: '\u2014'
                                          })
                                  })
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-3 text-text-muted text-xs',
                                  children: new Date(wallet.createdAt).toLocaleString()
                                }),
                                _jsx('td', {
                                  className: 'px-4 py-3 text-right',
                                  children: _jsxs('div', {
                                    className: 'inline-flex items-center gap-1',
                                    children: [
                                      _jsx('button', {
                                        onClick: () => handleEdit(wallet),
                                        className:
                                          'p-1.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-primary transition-colors',
                                        title: t('wallets.editWallet'),
                                        children: _jsx(Edit3, { size: 14 })
                                      }),
                                      _jsx('button', {
                                        onClick: () => setDeleteTarget(wallet),
                                        className:
                                          'p-1.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-danger transition-colors',
                                        title: t('wallets.deleteWallet'),
                                        children: _jsx(Trash2, { size: 14 })
                                      })
                                    ]
                                  })
                                })
                              ]
                            },
                            wallet.id
                          )
                        })
                      })
                    ]
                  })
                }),
                totalPages > 1 &&
                  _jsxs('div', {
                    className: 'flex items-center justify-between',
                    children: [
                      _jsxs('span', {
                        className: 'text-sm text-text-muted',
                        children: [
                          t('common.total', { count: total }),
                          ' \u00B7',
                          ' ',
                          t('common.page', { current: page, total: totalPages })
                        ]
                      }),
                      _jsxs('div', {
                        className: 'flex items-center gap-1',
                        children: [
                          _jsx('button', {
                            onClick: () => setPage((p) => Math.max(1, p - 1)),
                            disabled: page <= 1,
                            className:
                              'p-1.5 rounded hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
                            children: _jsx(ChevronLeft, { size: 18 })
                          }),
                          _jsx('button', {
                            onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
                            disabled: page >= totalPages,
                            className:
                              'p-1.5 rounded hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
                            children: _jsx(ChevronRight, { size: 18 })
                          })
                        ]
                      })
                    ]
                  })
              ]
            }),
      showCreateModal &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: closeCreateModal,
          children: _jsxs('div', {
            className:
              'bg-bg-card rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold text-text-primary mb-4',
                children: t('wallets.createModal.title')
              }),
              _jsxs('div', {
                className: 'flex border-b border-border-light mb-4',
                children: [
                  _jsx('button', {
                    onClick: () => {
                      setCreateTab('keypair')
                      setGeneratedKey(null)
                      setGeneratedMnemonic('')
                      setMnemonicDerivedResults([])
                    },
                    className: `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      createTab === 'keypair'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-muted hover:text-text-secondary'
                    }`,
                    children: t('wallets.tabKeypair')
                  }),
                  _jsx('button', {
                    onClick: () => {
                      setCreateTab('mnemonic')
                      setGeneratedKey(null)
                      setGeneratedMnemonic('')
                      setMnemonicDerivedResults([])
                    },
                    className: `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      createTab === 'mnemonic'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-muted hover:text-text-secondary'
                    }`,
                    children: t('wallets.tabMnemonic')
                  })
                ]
              }),
              createTab === 'keypair' &&
                _jsxs(_Fragment, {
                  children: [
                    _jsxs('div', {
                      className: 'mb-4',
                      children: [
                        _jsx('label', {
                          className: 'block text-sm font-medium text-text-secondary mb-1.5',
                          children: t('wallets.createModal.selectType')
                        }),
                        _jsx('div', {
                          className: 'flex gap-2',
                          children: WALLET_TYPE_OPTIONS.map((opt) =>
                            _jsx(
                              'button',
                              {
                                onClick: () => {
                                  setCreateType(opt.value)
                                  setGeneratedKey(null)
                                },
                                className: `px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                  createType === opt.value
                                    ? `${opt.color} border-current`
                                    : 'border-border-light text-text-secondary hover:border-border-hover'
                                }`,
                                children: opt.label
                              },
                              opt.value
                            )
                          )
                        })
                      ]
                    }),
                    !generatedKey
                      ? _jsx('button', {
                          onClick: handleGenerate,
                          disabled: generating,
                          className:
                            'w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors',
                          children: generating
                            ? t('wallets.createModal.generating')
                            : t('wallets.createModal.generate')
                        })
                      : _jsxs('div', {
                          className: 'space-y-3',
                          children: [
                            _jsxs('div', {
                              children: [
                                _jsx('label', {
                                  className: 'block text-sm font-medium text-text-secondary mb-1',
                                  children: t('wallets.createModal.address')
                                }),
                                _jsx('div', {
                                  className:
                                    'p-2 bg-bg-tertiary rounded-lg text-xs font-mono break-all text-text-primary',
                                  children: generatedKey.address
                                })
                              ]
                            }),
                            _jsxs('div', {
                              children: [
                                _jsx('label', {
                                  className: 'block text-sm font-medium text-text-secondary mb-1',
                                  children: t('wallets.createModal.privateKey')
                                }),
                                _jsx('div', {
                                  className:
                                    'p-2 bg-bg-tertiary rounded-lg text-xs font-mono break-all text-text-primary',
                                  children: generatedKey.privateKey
                                })
                              ]
                            }),
                            _jsxs('div', {
                              className: 'flex gap-2 pt-2',
                              children: [
                                _jsx('button', {
                                  onClick: closeCreateModal,
                                  className:
                                    'flex-1 py-2 border border-border-light text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-card-hover transition-colors',
                                  children: t('common.cancel')
                                }),
                                _jsx('button', {
                                  onClick: handleSaveCreated,
                                  disabled: saving,
                                  className:
                                    'flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors',
                                  children: saving
                                    ? t('wallets.createModal.saving')
                                    : t('wallets.createModal.save')
                                })
                              ]
                            })
                          ]
                        })
                  ]
                }),
              createTab === 'mnemonic' &&
                _jsx(_Fragment, {
                  children: !generatedMnemonic
                    ? _jsx('button', {
                        onClick: handleGenerateMnemonic,
                        disabled: generatingMnemonic,
                        className:
                          'w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors',
                        children: generatingMnemonic
                          ? t('wallets.createModal.generatingMnemonic')
                          : t('wallets.createModal.generateMnemonicBtn')
                      })
                    : _jsxs('div', {
                        className: 'space-y-4',
                        children: [
                          _jsxs('div', {
                            children: [
                              _jsx('label', {
                                className: 'block text-sm font-medium text-text-secondary mb-1',
                                children: t('wallets.createModal.mnemonic')
                              }),
                              _jsx('div', {
                                className:
                                  'p-2 bg-bg-tertiary rounded-lg text-xs font-mono break-all select-all text-text-primary',
                                children: generatedMnemonic
                              })
                            ]
                          }),
                          _jsxs('div', {
                            children: [
                              _jsx('label', {
                                className: 'block text-sm font-medium text-text-secondary mb-1.5',
                                children: t('wallets.importModal.walletTypes')
                              }),
                              _jsx('div', {
                                className: 'flex gap-2',
                                children: WALLET_TYPE_OPTIONS.map((opt) =>
                                  _jsx(
                                    'button',
                                    {
                                      onClick: () => toggleMnemonicImportType(opt.value),
                                      className: `px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                        mnemonicImportTypes.includes(opt.value)
                                          ? `${opt.color} border-current`
                                          : 'border-border-light text-text-secondary hover:border-border-hover'
                                      }`,
                                      children: opt.label
                                    },
                                    opt.value
                                  )
                                )
                              })
                            ]
                          }),
                          _jsxs('div', {
                            children: [
                              _jsx('label', {
                                className: 'block text-sm font-medium text-text-secondary mb-1.5',
                                children: t('wallets.importModal.deriveCount')
                              }),
                              _jsx('input', {
                                type: 'number',
                                min: 1,
                                max: 100,
                                value: mnemonicDeriveCount,
                                onChange: (e) =>
                                  setMnemonicDeriveCount(
                                    Math.max(1, Math.min(100, Number(e.target.value)))
                                  ),
                                className:
                                  'w-24 px-3 py-2 border border-border-light rounded-lg text-sm bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                              })
                            ]
                          }),
                          mnemonicDerivedResults.length === 0
                            ? _jsx('button', {
                                onClick: handleDeriveFromGeneratedMnemonic,
                                disabled: mnemonicDeriving || mnemonicImportTypes.length === 0,
                                className:
                                  'w-full py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success-hover disabled:opacity-50 transition-colors',
                                children: mnemonicDeriving
                                  ? t('wallets.createModal.deriving')
                                  : t('wallets.createModal.deriveFromMnemonic')
                              })
                            : _jsxs(_Fragment, {
                                children: [
                                  _jsxs('div', {
                                    children: [
                                      _jsx('label', {
                                        className:
                                          'block text-sm font-medium text-text-secondary mb-1.5',
                                        children: t('wallets.importModal.results')
                                      }),
                                      _jsx('div', {
                                        className:
                                          'border border-border-light rounded-lg overflow-hidden max-h-60 overflow-y-auto',
                                        children: _jsxs('table', {
                                          className: 'w-full text-xs',
                                          children: [
                                            _jsx('thead', {
                                              children: _jsxs('tr', {
                                                className:
                                                  'bg-bg-tertiary border-b border-border-light',
                                                children: [
                                                  _jsx('th', {
                                                    className:
                                                      'text-left px-3 py-2 font-medium text-text-muted',
                                                    children: '#'
                                                  }),
                                                  _jsx('th', {
                                                    className:
                                                      'text-left px-3 py-2 font-medium text-text-muted',
                                                    children: t('wallets.walletType')
                                                  }),
                                                  _jsx('th', {
                                                    className:
                                                      'text-left px-3 py-2 font-medium text-text-muted',
                                                    children: t('wallets.address')
                                                  })
                                                ]
                                              })
                                            }),
                                            _jsx('tbody', {
                                              children: mnemonicDerivedResults.map((r, i) =>
                                                _jsxs(
                                                  'tr',
                                                  {
                                                    className: 'border-b border-border-light/50',
                                                    children: [
                                                      _jsx('td', {
                                                        className: 'px-3 py-1.5 text-text-muted',
                                                        children: r.index
                                                      }),
                                                      _jsx('td', {
                                                        className: 'px-3 py-1.5',
                                                        children: _jsx('span', {
                                                          className: `inline-block px-1.5 py-0.5 rounded text-xs font-medium ${WALLET_TYPE_BADGE[r.walletType] || 'bg-gray-100 text-gray-600'}`,
                                                          children: r.walletType.toUpperCase()
                                                        })
                                                      }),
                                                      _jsx('td', {
                                                        className:
                                                          'px-3 py-1.5 font-mono text-text-secondary',
                                                        children: truncateAddress(r.address)
                                                      })
                                                    ]
                                                  },
                                                  i
                                                )
                                              )
                                            })
                                          ]
                                        })
                                      })
                                    ]
                                  }),
                                  _jsxs('div', {
                                    className: 'flex gap-2 pt-2',
                                    children: [
                                      _jsx('button', {
                                        onClick: closeCreateModal,
                                        className:
                                          'flex-1 py-2 border border-border-light text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-card-hover transition-colors',
                                        children: t('common.cancel')
                                      }),
                                      _jsx('button', {
                                        onClick: handleSaveMnemonicDerived,
                                        disabled: mnemonicSaving,
                                        className:
                                          'flex-1 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success-hover disabled:opacity-50 transition-colors',
                                        children: mnemonicSaving
                                          ? t('wallets.createModal.saving')
                                          : t('wallets.importModal.saveAll')
                                      })
                                    ]
                                  })
                                ]
                              })
                        ]
                      })
                })
            ]
          })
        }),
      showImportModal &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: closeImportModal,
          children: _jsxs('div', {
            className:
              'bg-bg-card rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold text-text-primary mb-4',
                children: t('wallets.importModal.title')
              }),
              _jsxs('div', {
                className: 'space-y-4',
                children: [
                  _jsxs('div', {
                    children: [
                      _jsx('label', {
                        className: 'block text-sm font-medium text-text-secondary mb-1.5',
                        children: t('wallets.importModal.mnemonic')
                      }),
                      _jsx('textarea', {
                        value: mnemonic,
                        onChange: (e) => setMnemonic(e.target.value),
                        placeholder: t('wallets.importModal.mnemonicPlaceholder'),
                        rows: 3,
                        className:
                          'w-full px-3 py-2 border border-border-light rounded-lg text-sm bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary resize-none'
                      })
                    ]
                  }),
                  _jsxs('div', {
                    children: [
                      _jsx('label', {
                        className: 'block text-sm font-medium text-text-secondary mb-1.5',
                        children: t('wallets.importModal.walletTypes')
                      }),
                      _jsx('div', {
                        className: 'flex gap-2',
                        children: WALLET_TYPE_OPTIONS.map((opt) =>
                          _jsx(
                            'button',
                            {
                              onClick: () => toggleImportType(opt.value),
                              className: `px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                importTypes.includes(opt.value)
                                  ? `${opt.color} border-current`
                                  : 'border-border-light text-text-secondary hover:border-border-hover'
                              }`,
                              children: opt.label
                            },
                            opt.value
                          )
                        )
                      })
                    ]
                  }),
                  _jsxs('div', {
                    children: [
                      _jsx('label', {
                        className: 'block text-sm font-medium text-text-secondary mb-1.5',
                        children: t('wallets.importModal.deriveCount')
                      }),
                      _jsx('input', {
                        type: 'number',
                        min: 1,
                        max: 100,
                        value: deriveCount,
                        onChange: (e) =>
                          setDeriveCount(Math.max(1, Math.min(100, Number(e.target.value)))),
                        className:
                          'w-24 px-3 py-2 border border-border-light rounded-lg text-sm bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                      })
                    ]
                  }),
                  derivedResults.length === 0
                    ? _jsx('button', {
                        onClick: handleDerive,
                        disabled: deriving || !mnemonic.trim() || importTypes.length === 0,
                        className:
                          'w-full py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success-hover disabled:opacity-50 transition-colors',
                        children: deriving
                          ? t('wallets.importModal.deriving')
                          : t('wallets.importModal.derive')
                      })
                    : _jsxs(_Fragment, {
                        children: [
                          _jsxs('div', {
                            children: [
                              _jsx('label', {
                                className: 'block text-sm font-medium text-text-secondary mb-1.5',
                                children: t('wallets.importModal.results')
                              }),
                              _jsx('div', {
                                className:
                                  'border border-border-light rounded-lg overflow-hidden max-h-60 overflow-y-auto',
                                children: _jsxs('table', {
                                  className: 'w-full text-xs',
                                  children: [
                                    _jsx('thead', {
                                      children: _jsxs('tr', {
                                        className: 'bg-bg-tertiary border-b border-border-light',
                                        children: [
                                          _jsx('th', {
                                            className:
                                              'text-left px-3 py-2 font-medium text-text-muted',
                                            children: '#'
                                          }),
                                          _jsx('th', {
                                            className:
                                              'text-left px-3 py-2 font-medium text-text-muted',
                                            children: t('wallets.walletType')
                                          }),
                                          _jsx('th', {
                                            className:
                                              'text-left px-3 py-2 font-medium text-text-muted',
                                            children: t('wallets.address')
                                          })
                                        ]
                                      })
                                    }),
                                    _jsx('tbody', {
                                      children: derivedResults.map((r, i) =>
                                        _jsxs(
                                          'tr',
                                          {
                                            className: 'border-b border-border-light/50',
                                            children: [
                                              _jsx('td', {
                                                className: 'px-3 py-1.5 text-text-muted',
                                                children: r.index
                                              }),
                                              _jsx('td', {
                                                className: 'px-3 py-1.5',
                                                children: _jsx('span', {
                                                  className: `inline-block px-1.5 py-0.5 rounded text-xs font-medium ${WALLET_TYPE_BADGE[r.walletType] || 'bg-gray-100 text-gray-600'}`,
                                                  children: r.walletType.toUpperCase()
                                                })
                                              }),
                                              _jsx('td', {
                                                className:
                                                  'px-3 py-1.5 font-mono text-text-secondary',
                                                children: truncateAddress(r.address)
                                              })
                                            ]
                                          },
                                          i
                                        )
                                      )
                                    })
                                  ]
                                })
                              })
                            ]
                          }),
                          _jsxs('div', {
                            className: 'flex gap-2 pt-2',
                            children: [
                              _jsx('button', {
                                onClick: closeImportModal,
                                className:
                                  'flex-1 py-2 border border-border-light text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-card-hover transition-colors',
                                children: t('common.cancel')
                              }),
                              _jsx('button', {
                                onClick: handleSaveImported,
                                disabled: importSaving,
                                className:
                                  'flex-1 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success-hover disabled:opacity-50 transition-colors',
                                children: importSaving
                                  ? t('wallets.importModal.saving')
                                  : t('wallets.importModal.saveAll')
                              })
                            ]
                          })
                        ]
                      })
                ]
              })
            ]
          })
        }),
      editTarget &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: () => setEditTarget(null),
          children: _jsxs('div', {
            className: 'bg-bg-card rounded-xl shadow-xl w-full max-w-md mx-4 p-6',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold text-text-primary mb-4',
                children: t('wallets.editModal.title')
              }),
              _jsxs('div', {
                className: 'mb-4',
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-text-secondary mb-1',
                    children: t('wallets.address')
                  }),
                  _jsx('div', {
                    className:
                      'p-2 bg-bg-tertiary rounded-lg text-xs font-mono break-all text-text-primary',
                    children: editTarget.address
                  })
                ]
              }),
              _jsxs('div', {
                className: 'mb-4',
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-medium text-text-secondary mb-1.5',
                    children: t('wallets.editModal.labels')
                  }),
                  _jsx('div', {
                    className: 'flex flex-wrap gap-1.5 mb-2',
                    children: editLabels.map((label) =>
                      _jsxs(
                        'span',
                        {
                          className:
                            'inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs',
                          children: [
                            label,
                            _jsx('button', {
                              onClick: () => removeEditLabel(label),
                              className: 'text-primary/70 hover:text-primary transition-colors',
                              children: '\u00D7'
                            })
                          ]
                        },
                        label
                      )
                    )
                  }),
                  _jsxs('div', {
                    className: 'flex gap-2',
                    children: [
                      _jsx('input', {
                        type: 'text',
                        value: editLabelInput,
                        onChange: (e) => setEditLabelInput(e.target.value),
                        onKeyDown: handleEditLabelKeyDown,
                        placeholder: t('wallets.editModal.labelsPlaceholder'),
                        className:
                          'flex-1 px-3 py-1.5 border border-border-light rounded-lg text-sm bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary'
                      }),
                      _jsx('button', {
                        onClick: addEditLabel,
                        disabled: !editLabelInput.trim(),
                        className:
                          'px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors',
                        children: t('wallets.editModal.addLabel')
                      })
                    ]
                  })
                ]
              }),
              _jsxs('div', {
                className: 'flex gap-2 pt-2',
                children: [
                  _jsx('button', {
                    onClick: () => setEditTarget(null),
                    className:
                      'flex-1 py-2 border border-border-light text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-card-hover transition-colors',
                    children: t('common.cancel')
                  }),
                  _jsx('button', {
                    onClick: handleSaveEdit,
                    disabled: editSaving,
                    className:
                      'flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors',
                    children: editSaving ? t('wallets.editModal.saving') : t('common.save')
                  })
                ]
              })
            ]
          })
        }),
      deleteTarget &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: () => setDeleteTarget(null),
          children: _jsxs('div', {
            className: 'bg-bg-card rounded-xl shadow-xl w-full max-w-sm mx-4 p-6',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold text-text-primary mb-2',
                children: t('wallets.deleteWallet')
              }),
              _jsx('p', {
                className: 'text-sm text-text-secondary mb-4',
                children: t('wallets.confirmDelete')
              }),
              _jsx('p', {
                className:
                  'text-xs font-mono bg-bg-tertiary p-2 rounded-lg mb-4 break-all text-text-primary',
                children: deleteTarget.address
              }),
              _jsxs('div', {
                className: 'flex gap-2',
                children: [
                  _jsx('button', {
                    onClick: () => setDeleteTarget(null),
                    className:
                      'flex-1 py-2 border border-border-light text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-card-hover transition-colors',
                    children: t('common.cancel')
                  }),
                  _jsx('button', {
                    onClick: handleDelete,
                    disabled: deleting,
                    className:
                      'flex-1 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger-hover disabled:opacity-50 transition-colors',
                    children: deleting ? t('common.loading') : t('common.delete')
                  })
                ]
              })
            ]
          })
        }),
      showBatchConfirm &&
        _jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40',
          onClick: () => setShowBatchConfirm(false),
          children: _jsxs('div', {
            className: 'bg-bg-card rounded-xl shadow-xl w-full max-w-sm mx-4 p-6',
            onClick: (e) => e.stopPropagation(),
            children: [
              _jsx('h2', {
                className: 'text-lg font-semibold text-text-primary mb-2',
                children: t('wallets.batchDelete')
              }),
              _jsx('p', {
                className: 'text-sm text-text-secondary mb-4',
                children: t('wallets.confirmBatchDelete', { count: selectedIds.size })
              }),
              _jsxs('div', {
                className: 'flex gap-2',
                children: [
                  _jsx('button', {
                    onClick: () => setShowBatchConfirm(false),
                    className:
                      'flex-1 py-2 border border-border-light text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-card-hover transition-colors',
                    children: t('common.cancel')
                  }),
                  _jsx('button', {
                    onClick: handleBatchDelete,
                    disabled: batchDeleting,
                    className:
                      'flex-1 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger-hover disabled:opacity-50 transition-colors',
                    children: batchDeleting ? t('common.loading') : t('common.delete')
                  })
                ]
              })
            ]
          })
        })
    ]
  })
}
export default Wallets
