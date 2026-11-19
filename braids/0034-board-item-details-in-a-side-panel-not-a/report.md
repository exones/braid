Interim report (mockups stage; nothing is built yet).

The user chose to see the shape before it is built: the board item details as a side panel or as a pop-up. Both are mocked up on demo-like data in `mockups/details.html` (open it with `#shape=panel|modal&item=0003|0005&s=A`), with PNGs for desktop (1440 px) and phone (390 px): a braid with strands, and a strand with a request banner, actions in place.

Recommendation: the side panel (a). Why: the board stays visible and scrollable beside it, which is the point of this story. Opening a neighbouring card swaps the panel's content. It maps well onto the existing hash routes, and on phone it becomes the same full-screen view as the pop-up. Its cost: it covers the right-hand lanes (Waiting, Done) at desktop width, and it is narrow for a braid's strand list, so strands become a chip row inside the details instead of a rail. The pop-up (b) has room for a left rail of strands like today's item page, but it dims the whole board and covers the lane you clicked from.

Needs the user: shape: side panel (recommended) or centred pop-up for the item details.
