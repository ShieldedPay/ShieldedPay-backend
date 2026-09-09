import { createHash } from "crypto";

export interface MerkleDisbursementLeaf {
  recipient: string;
  amount: number;
  token: string;
  salt: string;
}

export interface MerkleTreeResult {
  root: string;
  leaves: string[];
  proofs: string[][];
}

/**
 * Computes a leaf hash with domain separation prefix 0x00
 * sha256(0x00 || recipient || amount || token || salt)
 */
export function computeDisbursementLeaf(
  recipient: string,
  amount: number,
  token: string,
  salt: string
): string {
  const buf = Buffer.concat([
    Buffer.from([0x00]), // Leaf domain separation byte
    Buffer.from(recipient, "utf-8"),
    Buffer.from(String(amount), "utf-8"),
    Buffer.from(token, "utf-8"),
    Buffer.from(salt, "hex"),
  ]);
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * Computes branch pair hash with domain separation prefix 0x01
 * sha256(0x01 || left || right)
 */
export function hashBranchPair(leftHex: string, rightHex: string): string {
  const buf = Buffer.concat([
    Buffer.from([0x01]), // Branch domain separation byte
    Buffer.from(leftHex, "hex"),
    Buffer.from(rightHex, "hex"),
  ]);
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * Computes a complete Merkle tree and generates sibling inclusion proofs
 * for all leaves using index-parity ordering.
 */
export function buildMerkleTree(leaves: string[]): MerkleTreeResult {
  if (leaves.length === 0) {
    return { root: "", leaves: [], proofs: [] };
  }

  if (leaves.length === 1) {
    return {
      root: leaves[0],
      leaves,
      proofs: [[]],
    };
  }

  // Initialize levels
  const levels: string[][] = [leaves.slice()];
  let currentLevel = leaves.slice();

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      // Duplicate last leaf if odd count
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      nextLevel.push(hashBranchPair(left, right));
    }
    levels.push(nextLevel);
    currentLevel = nextLevel;
  }

  const root = currentLevel[0];

  // Generate proof for each leaf
  const proofs: string[][] = [];
  for (let leafIdx = 0; leafIdx < leaves.length; leafIdx++) {
    const proof: string[] = [];
    let idx = leafIdx;

    for (let levelIdx = 0; levelIdx < levels.length - 1; levelIdx++) {
      const level = levels[levelIdx];
      const isEven = idx % 2 === 0;
      const siblingIdx = isEven ? idx + 1 : idx - 1;

      if (siblingIdx < level.length) {
        proof.push(level[siblingIdx]);
      } else {
        // Odd count: duplicate self
        proof.push(level[idx]);
      }

      idx = Math.floor(idx / 2);
    }
    proofs.push(proof);
  }

  return { root, leaves, proofs };
}

/**
 * Verifies a Merkle proof against the expected root using index parity
 */
export function verifyMerkleProof(
  leaf: string,
  proof: string[],
  root: string,
  index: number
): boolean {
  let computed = leaf;
  let idx = index;

  for (const sibling of proof) {
    if (idx % 2 === 0) {
      computed = hashBranchPair(computed, sibling);
    } else {
      computed = hashBranchPair(sibling, computed);
    }
    idx = Math.floor(idx / 2);
  }

  return computed.toLowerCase() === root.toLowerCase();
}
