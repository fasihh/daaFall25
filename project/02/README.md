#### Input strategy

Unlike the `2 x 10` files of varying complexity mention in the assignment, our application takes a single file with multiple test cases per algorithm. This results in a smooth user experience and also reduced file stress.

Sample inputs are available in the `tests/inputs` directory.
I have also provided simple test cases in `tests/inputs/simple` because the official ones are quite big and will take time to properly execute and be exportable.

#### Output strategy

The application outputs the steps in detail for both of the algorithms, but we also allow users to export the output produced for every test case individually into a `.txt` file (and `.png` in case of the closest pair algorithm).

Sample outputs for one test case (the simple ones) of each problem are available in the `tests/outputs` directory.
