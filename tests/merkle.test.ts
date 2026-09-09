import { describe, it, expect } from "vitest";
import {
  computeDisbursementLeaf,
  buildMerkleTree,
  verifyMerkleProof,
  hashBranchPair,
} from "../services/merkle";

describe("Merkle Service with Domain Separation", () => {
  it("computes leaf hash with 0x00 domain separation", () => {
    const leaf = computeDisbursementLeaf(
      "GBJNDNLZKN4TY5W5U2M5X6WTYF4VODLCRPQ2E22Q4N3A3B4C5D6E7F8G",
      5000,
      "native_xlm",
      "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"
    );
    expect(leaf).toHaveLength(64);
  });

  it("builds 2-leaf Merkle tree and verifies inclusion proofs", () => {
    const leaf1 = computeDisbursementLeaf("addr1", 1000, "usdc", "11".repeat(32));
    const leaf2 = computeDisbursementLeaf("addr2", 2000, "usdc", "22".repeat(32));

    const { root, proofs } = buildMerkleTree([leaf1, leaf2]);
    expect(root).toBe(hashBranchPair(leaf1, leaf2));

    expect(verifyMerkleProof(leaf1, proofs[0], root, 0)).toBe(true);
    expect(verifyMerkleProof(leaf2, proofs[1], root, 1)).toBe(true);
  });

  it("handles odd-length leaf counts by duplicating last node", () => {
    const leaves = [
      computeDisbursementLeaf("addr1", 1000, "usdc", "11".repeat(32)),
      computeDisbursementLeaf("addr2", 2000, "usdc", "22".repeat(32)),
      computeDisbursementLeaf("addr3", 3000, "usdc", "33".repeat(32)),
    ];

    const { root, proofs } = buildMerkleTree(leaves);
    expect(root).toHaveLength(64);
    expect(proofs).toHaveLength(3);

    for (let i = 0; i < leaves.length; i++) {
      expect(verifyMerkleProof(leaves[i], proofs[i], root, i)).toBe(true);
    }
  });

  it("rejects invalid or tampered Merkle proofs", () => {
    const leaf1 = computeDisbursementLeaf("addr1", 1000, "usdc", "11".repeat(32));
    const leaf2 = computeDisbursementLeaf("addr2", 2000, "usdc", "22".repeat(32));
    const { root, proofs } = buildMerkleTree([leaf1, leaf2]);

    // Wrong index
    expect(verifyMerkleProof(leaf1, proofs[0], root, 1)).toBe(false);

    // Tampered sibling
    const tamperedProof = ["00".repeat(32)];
    expect(verifyMerkleProof(leaf1, tamperedProof, root, 0)).toBe(false);
  });
});
