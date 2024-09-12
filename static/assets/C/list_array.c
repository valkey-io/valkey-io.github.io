/* 
MIT License

Copyright (c) 2024 Dan Touitou

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

#include <time.h>
#include <stdio.h> 
#include <stdlib.h>
#include <string.h>

typedef struct list {
    unsigned int val; 
    struct list *next; 
} list;


/* returns a list of size elements with reduced memory locality */
list *build_list(size_t size) {
    list **la = malloc(size * sizeof(list *)); 
    list *res = NULL, *no;
    unsigned int r; 
    
    memset(la, 0,size * sizeof(list *));

    for (int i = 0; i < size; i++) { 
        no = malloc(sizeof(list)); 
        r = (unsigned int)rand(); 
        no->val = r; 
        no->next = la[r % size]; 
        la[r % size] = no;
    }

    for (int i = 0; i < size; i++) { 
        if (la[i] == NULL)
            continue; 
        list *tmp = la[i]; 
        while(tmp->next)
            tmp = tmp->next; 
        tmp->next = res; 
        res = la[i]; 
    }

    free(la); 
    return res; 
} 

unsigned long interleavedWithPrefetchSum(size_t arr_size, list **la) {
    list **lthreads =  malloc(arr_size * sizeof(list *)); 
    unsigned long res = 0; 
    int n = arr_size; 

    for (int i = 0; i < arr_size; i++) {
        lthreads[i] = la[i]; 
        if (lthreads[i]) 
            __builtin_prefetch(lthreads[i]);
        else 
            n--; 
    } 

    while(n) {
        for (int i = 0; i < arr_size; i++) { 
            if (lthreads[i] == NULL) 
                continue; 
            res += lthreads[i]->val; 
            lthreads[i] = lthreads[i]->next; 
            if (lthreads[i]) 
                __builtin_prefetch(lthreads[i]);
            else 
                n--;
        }  
    }

    free(lthreads);
    return res; 
}

unsigned long interleavedSum(size_t arr_size, list **la) {
    list **lthreads =  malloc(arr_size * sizeof(list *)); 
    unsigned long res = 0; 
    int n = arr_size; 

    for (int i = 0; i < arr_size; i++) {
        lthreads[i] = la[i]; 
        if (lthreads[i] == NULL) 
            n--; 
    } 

    while(n) {
        for (int i = 0; i < arr_size; i++) { 
            if (lthreads[i] == NULL) 
                continue; 
            res += lthreads[i]->val;
            lthreads[i] = lthreads[i]->next; 
            if (lthreads[i] == NULL) 
                n--;
        }  
    }

    free(lthreads);
    return res; 
}

unsigned long sequentialSum(size_t arr_size, list **la) {
    list *lp;
    unsigned long  res = 0; 

    for (int i = 0; i < arr_size; i++) { 
        lp = la[i]; 
        while (lp) { 
            res += lp->val;
            lp = lp->next;
        }
    }

    return res; 
}

void main(int argc, char **argv)
{ 
    struct timespec ts;
    long long start, end;
    unsigned long res;

    if (argc != 3) { 
        printf("usage 'test number_of_lists size_of_list'\n"); 
        exit(-1);
    }

    clock_gettime(CLOCK_MONOTONIC, &ts);
    srand((ts.tv_sec * 1000000LL) + (ts.tv_nsec / 1000));
    size_t arr_l = atoi(argv[1]); 
    size_t list_l = atoi(argv[2]); 
    
    printf("testing with %ld lists of size %ld\n", arr_l, list_l); 

    list **la = malloc(arr_l * sizeof(list *));  
    for (int i = 0; i < arr_l; i++) la[i] = build_list(list_l);

    for (int i = 0; i < 10; i++) {  
        clock_gettime(CLOCK_MONOTONIC, &ts);
        start = (ts.tv_sec * 1000000LL) + (ts.tv_nsec / 1000);
        res = sequentialSum(arr_l, la); 
        clock_gettime(CLOCK_MONOTONIC, &ts);
        end = (ts.tv_sec * 1000000LL) + (ts.tv_nsec / 1000);
        printf("%ld usec elapsed with sequential scan res %ld\n",end - start, res); 

        clock_gettime(CLOCK_MONOTONIC, &ts);
        start = (ts.tv_sec * 1000000LL) + (ts.tv_nsec / 1000);
        res = interleavedSum(arr_l, la); 
        clock_gettime(CLOCK_MONOTONIC, &ts);
        end = (ts.tv_sec * 1000000LL) + (ts.tv_nsec / 1000);
        printf("%ld usec elapsed with interleaved scan res %ld\n", end - start, res); 

        clock_gettime(CLOCK_MONOTONIC, &ts);
        start = (ts.tv_sec * 1000000LL) + (ts.tv_nsec / 1000);
        res = interleavedWithPrefetchSum(arr_l, la); 
        clock_gettime(CLOCK_MONOTONIC, &ts);
        end = (ts.tv_sec * 1000000LL) + (ts.tv_nsec / 1000);
        printf("%ld usec elapsed with interleaved&prefetch scan res %ld\n\n", end - start, res); 
    }
}   